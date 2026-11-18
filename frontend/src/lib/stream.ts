// Sends a message and reads the reply as it arrives (Server-Sent Events over a POST request).
//
// The browser's own EventSource cannot send our login header and only does GET, so we use
// fetch() and cut the stream into events ourselves (decisions A19, A24).
// Each event looks like this on the wire:
//
//     event: token
//     data: {"text": "Hello"}
//     <empty line>

import { API_BASE_URL, ApiError, readError } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

// The events the backend sends, in this order (see backend/app/services/chat_stream.py).
export type ServerEvent =
  | {
      event: "start";
      data: {
        chat_id: number;
        user_message_id: number;
        complexity: string;
        uncertain: boolean;
        reason: string;
        planned_tier: string;
      };
    }
  | { event: "fallback"; data: { from_tier: string; to_tier: string; reason: string } }
  | { event: "token"; data: { text: string } }
  | {
      event: "done";
      data: {
        message_id: number;
        model: string;
        tier: string;
        planned_tier: string;
        fallback_used: boolean;
        fallback_reason: string | null;
        complexity: string;
        seconds: number;
        tokens_in: number | null;
        tokens_out: number | null;
        estimated_cost_usd: number | null;
        actual_cost_usd: number | null;
        usage_estimated: boolean;
      };
    }
  | { event: "title"; data: { chat_id: number; title: string } }
  | {
      event: "error";
      data: { kind: string; message: string; partial_saved: boolean; message_id?: number };
    };

export type SendAction = "send" | "regenerate" | "edit";

function parseFrame(frame: string): ServerEvent | null {
  let name = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) name = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    // lines that start with ":" are keep-alive comments: ignored
  }
  if (dataLines.length === 0) return null;
  try {
    return { event: name, data: JSON.parse(dataLines.join("\n")) } as ServerEvent;
  } catch {
    return null;
  }
}

// Calls onEvent for every event as it arrives. Throws an ApiError if the request itself fails
// (wrong chat, empty message, server down). Pass an AbortSignal to stop listening (the Stop button).
export async function streamMessage(
  chatId: number,
  body: { action: SendAction; text?: string },
  onEvent: (event: ServerEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const token = getToken();
  if (!token) throw new ApiError(401, "Not logged in.");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error; // the user pressed Stop
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  if (!response.ok) {
    if (response.status === 401) clearToken();
    throw await readError(response);
  }
  if (!response.body) throw new ApiError(0, "The server sent no data.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, "\n");
    let end = buffer.indexOf("\n\n");
    while (end !== -1) {
      const event = parseFrame(buffer.slice(0, end));
      buffer = buffer.slice(end + 2);
      if (event) onEvent(event);
      end = buffer.indexOf("\n\n");
    }
  }
}

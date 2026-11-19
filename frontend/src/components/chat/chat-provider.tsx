"use client";

// All the state of the chat screen and the sidebar list, in one place. It sits above the pages
// (in the (app) layout), so a reply that is streaming keeps running when the address changes
// from /chat to /chat/12 after the first message.
//
// Anything inside the shell reads it with useChat().

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ApiError } from "@/lib/api";
import {
  createChat,
  deleteChat as deleteChatApi,
  getChat,
  listChats,
  renameChat as renameChatApi,
  type ChatSummary,
  type ProjectRef,
  type Routing,
  type ServerMessage,
} from "@/lib/chats";
import { tierLabel } from "@/lib/format";
import { createProjectChat } from "@/lib/projects";
import { streamMessage, type SendAction, type ServerEvent } from "@/lib/stream";

const NEW_CHAT_TITLE = "New chat";

// A message as the screen shows it. A reply that is still arriving has pending = true.
export type UiMessage = {
  key: string; // a stable key for React ("m12" for saved messages, "t3" for ones not saved yet)
  id: number | null; // the database id, once known
  sender: "user" | "assistant";
  text: string;
  routing: Routing | null; // tier, time and estimated cost (replies only)
  pending: boolean; // the reply is still being written
  stopped: boolean; // the user pressed Stop
  failed: boolean; // the user's message could not be sent
  notice: string | null; // for example "Local is unavailable, using Small cloud..."
  error: string | null; // the reply was cut short
};

type Phase = "idle" | "loading" | "streaming";

type State = {
  chats: ChatSummary[];
  chatsStatus: "loading" | "ready" | "error";
  chatsError: string | null;
  search: string;
  activeChatId: number | null;
  title: string;
  project: ProjectRef | null; // the project of the open chat (or of the new chat about to start)
  messages: UiMessage[];
  phase: Phase;
  loadError: string | null; // the open chat could not be loaded
  banner: string | null; // the last send failed (shown under the messages)
};

const INITIAL: State = {
  chats: [],
  chatsStatus: "loading",
  chatsError: null,
  search: "",
  activeChatId: null,
  title: NEW_CHAT_TITLE,
  project: null,
  messages: [],
  phase: "idle",
  loadError: null,
  banner: null,
};

type Chat = State & {
  send: (text: string) => Promise<void>;
  stop: () => void;
  regenerate: () => Promise<void>;
  editLast: (text: string) => Promise<void>;
  newChat: () => void; // a new personal chat (clears the project)
  startProjectChat: (project: ProjectRef) => void; // a new chat inside a project
  retryOpen: () => void;
  retryChats: () => void;
  setSearch: (query: string) => void;
  renameChat: (chatId: number, title: string) => Promise<string | null>;
  deleteChat: (chatId: number) => Promise<string | null>;
};

const ChatContext = createContext<Chat | null>(null);

let temporaryKeys = 0;
function temporaryKey(): string {
  temporaryKeys += 1;
  return `t${temporaryKeys}`;
}

function fromServer(message: ServerMessage): UiMessage {
  return {
    key: `m${message.message_id}`,
    id: message.message_id,
    sender: message.sender,
    text: message.text,
    routing: message.routing,
    pending: false,
    stopped: false,
    failed: false,
    notice: null,
    error: null,
  };
}

function blank(sender: "user" | "assistant", text: string, pending: boolean): UiMessage {
  return {
    key: temporaryKey(),
    id: null,
    sender,
    text,
    routing: null,
    pending,
    stopped: false,
    failed: false,
    notice: null,
    error: null,
  };
}

// What the screen shows the moment the user acts, before the server answers.
function prepareMessages(messages: UiMessage[], action: SendAction, text?: string): UiMessage[] {
  const placeholder = blank("assistant", "", true);
  if (action === "send") return [...messages, blank("user", text ?? "", false), placeholder];

  const lastUser = messages.map((m) => m.sender).lastIndexOf("user");
  if (action === "edit" && lastUser >= 0) {
    const edited = { ...messages[lastUser], text: text ?? "", failed: false };
    return [...messages.slice(0, lastUser), edited, placeholder];
  }
  // regenerate: drop the old reply (everything after the last user message)
  return [...messages.slice(0, lastUser + 1), placeholder];
}

function updateLast(messages: UiMessage[], change: (message: UiMessage) => UiMessage | null): UiMessage[] {
  if (messages.length === 0) return messages;
  const last = messages[messages.length - 1];
  const changed = change(last);
  return changed === null ? messages.slice(0, -1) : [...messages.slice(0, -1), changed];
}

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

// Same wording as the backend's routing note, so a reply looks the same live and after a reload.
function fallbackNote(planned: string, used: string, reason: string | null): string {
  return `Planned ${planned}, answered by ${used}. Unavailable: ${reason ?? ""}`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>(INITIAL);

  // The functions below run later (after a request returns), so they read the CURRENT state
  // through this ref instead of the value from the render that created them.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false); // blocks a second send while one is running
  const listRequestRef = useRef(0); // to ignore the answer of an older chat-list request

  const goToLogin = useCallback(() => router.replace("/login"), [router]);

  // ---------- the chat list (sidebar) ----------

  const loadChats = useCallback(
    async (query: string) => {
      const request = ++listRequestRef.current;
      try {
        const chats = await listChats(query);
        if (request !== listRequestRef.current) return;
        setState((s) => ({ ...s, chats, chatsStatus: "ready", chatsError: null }));
      } catch (error) {
        if (request !== listRequestRef.current) return;
        if (error instanceof ApiError && error.status === 401) return goToLogin();
        setState((s) => ({ ...s, chatsStatus: "error", chatsError: errorText(error) }));
      }
    },
    [goToLogin],
  );

  // Load the list when the screen opens, and again (after a short pause) whenever the search changes.
  useEffect(() => {
    const timer = setTimeout(() => void loadChats(state.search), state.search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [state.search, loadChats]);

  const setSearch = useCallback((search: string) => setState((s) => ({ ...s, search })), []);
  const retryChats = useCallback(() => {
    setState((s) => ({ ...s, chatsStatus: "loading", chatsError: null }));
    void loadChats(stateRef.current.search);
  }, [loadChats]);

  // ---------- opening a chat ----------

  const openChat = useCallback(
    async (chatId: number | null) => {
      abortRef.current?.abort(); // leaving a chat stops its stream (what was written is already saved)
      if (chatId === null) {
        setState((s) => ({
          ...s,
          activeChatId: null,
          title: NEW_CHAT_TITLE,
          project: null,
          messages: [],
          phase: "idle",
          loadError: null,
          banner: null,
        }));
        return;
      }
      setState((s) => ({
        ...s,
        activeChatId: chatId,
        title: s.chats.find((c) => c.chat_id === chatId)?.title ?? "",
        project: null,
        messages: [],
        phase: "loading",
        loadError: null,
        banner: null,
      }));
      try {
        const chat = await getChat(chatId);
        if (stateRef.current.activeChatId !== chatId) return;
        setState((s) => ({
          ...s,
          title: chat.title,
          project: chat.project,
          messages: chat.messages.map(fromServer),
          phase: "idle",
        }));
      } catch (error) {
        if (stateRef.current.activeChatId !== chatId) return;
        if (error instanceof ApiError && error.status === 401) return goToLogin();
        const message =
          error instanceof ApiError && error.status === 404
            ? "This chat does not exist (it may have been deleted)."
            : errorText(error);
        setState((s) => ({ ...s, phase: "idle", loadError: message }));
      }
    },
    [goToLogin],
  );

  // The address decides which chat is open: /chat is a new chat, /chat/12 is chat 12.
  // (After the first message the address changes to /chat/12 by itself: then nothing is reloaded.)
  useEffect(() => {
    const match = pathname.match(/^\/chat(?:\/(\d+))?\/?$/);
    if (!match) return;
    const id = match[1] ? Number(match[1]) : null;
    if (id !== stateRef.current.activeChatId) void openChat(id);
  }, [pathname, openChat]);

  const retryOpen = useCallback(() => {
    const id = stateRef.current.activeChatId;
    if (id !== null) void openChat(id);
  }, [openChat]);

  // ---------- sending, stopping, regenerating, editing ----------

  const runStream = useCallback(
    async (chatId: number, action: SendAction, text?: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      const isActive = () => stateRef.current.activeChatId === chatId;
      setState((s) => ({
        ...s,
        phase: "streaming",
        banner: null,
        messages: prepareMessages(s.messages, action, text),
      }));

      let started = false; // the server has accepted the message
      let finished = false; // a "done" or "error" event arrived

      const interrupted = (message: string) =>
        setState((s) => ({
          ...s,
          banner: message,
          messages: updateLast(s.messages, (m) =>
            m.pending ? (m.text ? { ...m, pending: false, error: message } : null) : m,
          ),
        }));

      const handle = (event: ServerEvent) => {
        if (event.event === "title") {
          setState((s) => ({
            ...s,
            title: s.activeChatId === event.data.chat_id ? event.data.title : s.title,
            chats: s.chats.map((c) => (c.chat_id === event.data.chat_id ? { ...c, title: event.data.title } : c)),
          }));
          return;
        }
        if (!isActive()) return;

        if (event.event === "start") {
          started = true;
          // the user's message is saved now: remember its id (it can be edited from here on)
          const userMessageId = event.data.user_message_id;
          setState((s) => {
            const lastUser = s.messages.map((m) => m.sender).lastIndexOf("user");
            if (lastUser < 0 || s.messages[lastUser].id !== null) return s;
            const messages = [...s.messages];
            messages[lastUser] = { ...messages[lastUser], id: userMessageId };
            return { ...s, messages };
          });
        } else if (event.event === "fallback") {
          const note = `${tierLabel(event.data.from_tier)} is unavailable, using ${tierLabel(event.data.to_tier)}...`;
          setState((s) => ({ ...s, messages: updateLast(s.messages, (m) => ({ ...m, notice: note })) }));
        } else if (event.event === "token") {
          setState((s) => ({
            ...s,
            messages: updateLast(s.messages, (m) => ({ ...m, text: m.text + event.data.text, notice: null })),
          }));
        } else if (event.event === "done") {
          finished = true;
          const d = event.data;
          const routing: Routing = {
            complexity: d.complexity,
            tier: d.tier,
            model: d.model,
            seconds: d.seconds,
            estimated_cost_usd: d.estimated_cost_usd,
            note: d.fallback_used ? fallbackNote(d.planned_tier, d.tier, d.fallback_reason) : null,
          };
          setState((s) => ({
            ...s,
            // the chat moves to the top of the list
            chats: [
              ...s.chats.filter((c) => c.chat_id === chatId).map((c) => ({ ...c, updated_at: new Date().toISOString() })),
              ...s.chats.filter((c) => c.chat_id !== chatId),
            ],
            messages: updateLast(s.messages, (m) => ({
              ...m,
              key: `m${d.message_id}`,
              id: d.message_id,
              pending: false,
              notice: null,
              routing,
            })),
          }));
        } else if (event.event === "error") {
          finished = true;
          const e = event.data;
          setState((s) => ({
            ...s,
            banner: e.message,
            messages: updateLast(s.messages, (m) =>
              !m.pending ? m : e.partial_saved && m.text ? { ...m, pending: false, error: e.message, id: e.message_id ?? null } : null,
            ),
          }));
        }
      };

      try {
        await streamMessage(chatId, { action, text }, handle, controller.signal);
        if (isActive() && !finished) interrupted("The connection closed before the reply was finished.");
      } catch (error) {
        if (!isActive()) return;
        if (controller.signal.aborted) {
          // The user pressed Stop: keep what was written, so far.
          setState((s) => ({
            ...s,
            messages: updateLast(s.messages, (m) =>
              m.pending ? (m.text ? { ...m, pending: false, stopped: true } : null) : m,
            ),
          }));
        } else if (error instanceof ApiError && error.status === 401) {
          goToLogin();
        } else if (started) {
          interrupted(errorText(error));
        } else {
          // The server never accepted the message: show it as "not sent", with a retry.
          setState((s) => ({
            ...s,
            banner: errorText(error),
            messages: s.messages
              .filter((m) => !(m.pending && m.sender === "assistant"))
              .map((m, index, all) => (action === "send" && index === all.length - 1 ? { ...m, failed: true } : m)),
          }));
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        if (isActive()) setState((s) => (s.phase === "streaming" ? { ...s, phase: "idle" } : s));
      }
    },
    [goToLogin],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current || stateRef.current.phase !== "idle") return;
      busyRef.current = true;
      try {
        let chatId = stateRef.current.activeChatId;
        if (chatId === null) {
          // The first message of a new chat: create the chat, then put its number in the address.
          // Inside a project the chat is created in that project (the model then knows about it).
          const project = stateRef.current.project;
          const created = project ? createProjectChat(project.project_id) : createChat();
          const chat = await created.catch((error: unknown) => {
            if (error instanceof ApiError && error.status === 401) goToLogin();
            setState((s) => ({ ...s, banner: errorText(error) }));
            return null;
          });
          if (!chat) return;
          chatId = chat.chat_id;
          setState((s) => ({
            ...s,
            activeChatId: chat.chat_id,
            title: chat.title,
            // a project chat is listed inside its project, not in the sidebar
            chats: chat.project_id === null ? [chat, ...s.chats] : s.chats,
          }));
          window.history.replaceState(null, "", `/chat/${chat.chat_id}`);
        }
        await runStream(chatId, "send", trimmed);
      } finally {
        busyRef.current = false;
      }
    },
    [goToLogin, runStream],
  );

  const regenerate = useCallback(async () => {
    const chatId = stateRef.current.activeChatId;
    if (chatId === null || busyRef.current || stateRef.current.phase !== "idle") return;
    busyRef.current = true;
    try {
      await runStream(chatId, "regenerate");
    } finally {
      busyRef.current = false;
    }
  }, [runStream]);

  const editLast = useCallback(
    async (text: string) => {
      const chatId = stateRef.current.activeChatId;
      if (chatId === null || !text.trim() || busyRef.current || stateRef.current.phase !== "idle") return;
      busyRef.current = true;
      try {
        await runStream(chatId, "edit", text.trim());
      } finally {
        busyRef.current = false;
      }
    },
    [runStream],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  // ---------- starting a new chat ----------

  const newChat = useCallback(() => {
    void openChat(null);
  }, [openChat]);

  const startProjectChat = useCallback(
    (project: ProjectRef) => {
      void openChat(null); // stops a running reply and empties the screen
      setState((s) => ({ ...s, project }));
      router.push("/chat");
    },
    [openChat, router],
  );

  // ---------- rename and delete (they return an error message, or null when it worked) ----------

  const renameChat = useCallback(
    async (chatId: number, title: string): Promise<string | null> => {
      try {
        const chat = await renameChatApi(chatId, title);
        setState((s) => ({
          ...s,
          title: s.activeChatId === chatId ? chat.title : s.title,
          chats: s.chats.map((c) => (c.chat_id === chatId ? chat : c)),
        }));
        return null;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) goToLogin();
        return errorText(error);
      }
    },
    [goToLogin],
  );

  const deleteChat = useCallback(
    async (chatId: number): Promise<string | null> => {
      try {
        await deleteChatApi(chatId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) goToLogin();
        return errorText(error);
      }
      setState((s) => ({ ...s, chats: s.chats.filter((c) => c.chat_id !== chatId) }));
      if (stateRef.current.activeChatId === chatId) router.replace("/chat");
      return null;
    },
    [goToLogin, router],
  );

  const value = useMemo<Chat>(
    () => ({
      ...state,
      send,
      stop,
      regenerate,
      editLast,
      newChat,
      startProjectChat,
      retryOpen,
      retryChats,
      setSearch,
      renameChat,
      deleteChat,
    }),
    [state, send, stop, regenerate, editLast, newChat, startProjectChat, retryOpen, retryChats, setSearch, renameChat, deleteChat],
  );

  return <ChatContext value={value}>{children}</ChatContext>;
}

export function useChat(): Chat {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside the chat provider");
  return value;
}

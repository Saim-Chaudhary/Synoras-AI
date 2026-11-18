// Talks to the backend (FastAPI). Every call to the API goes through apiFetch.

// The address of the backend. It comes from NEXT_PUBLIC_API_URL (see .env.example).
// "NEXT_PUBLIC_" is what makes Next.js put the value into the code that runs in the browser.
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

// A failed call. The backend explains problems in a "detail" field; we turn it into this.
export class ApiError extends Error {
  status: number; // the HTTP status (401, 409, ...). 0 means "could not reach the server".
  fields: Record<string, string>; // problems with single inputs, by name: { email: "..." }

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

type Options = {
  method?: "GET" | "POST";
  body?: unknown; // sent as JSON
  token?: string | null; // sent as "Authorization: Bearer <token>"
};

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  if (!response.ok) throw await readError(response);
  return (await response.json()) as T;
}

// The backend sends errors in three shapes:
//   {"detail": "Invalid login"}                         a plain message
//   {"detail": [{"loc": ["body","email"], "msg": ..}]}  problems with specific inputs (422)
//   {"detail": {"status": "error", ...}}                other details (for example 503)
async function readError(response: Response): Promise<ApiError> {
  let detail: unknown;
  try {
    detail = (await response.json()).detail;
  } catch {
    return new ApiError(response.status, `Request failed (${response.status}).`);
  }

  if (typeof detail === "string") return new ApiError(response.status, detail);

  if (Array.isArray(detail)) {
    const fields: Record<string, string> = {};
    for (const item of detail) {
      const name = String(item?.loc?.[item.loc.length - 1] ?? "");
      if (name && item?.msg) fields[name] = String(item.msg);
    }
    return new ApiError(response.status, "Please correct the highlighted fields.", fields);
  }

  return new ApiError(response.status, `Request failed (${response.status}).`);
}

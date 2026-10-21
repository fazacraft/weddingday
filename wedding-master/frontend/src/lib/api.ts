const API_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "fz-token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public field?: string
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage yo'q — sessiya faqat xotirada qoladi */
  }
}

/** Backend'dan kelgan rasm/musiqa yo'llarini (/uploads/...) to'liq manzilga aylantiradi. */
export function mediaUrl(path: string): string {
  if (!path || /^https?:\/\//.test(path)) return path;
  return path.startsWith("/uploads/") ? `${API_URL}${path}` : path;
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("Serverga ulanib bo'lmadi", 0);
  }

  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    field?: string;
    errors?: { msg: string; path?: string }[];
  };
  if (!res.ok) {
    const first = data.errors?.[0];
    throw new ApiError(
      data.error ?? first?.msg ?? "Xatolik yuz berdi",
      res.status,
      data.field ?? first?.path
    );
  }
  return data as T;
}

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/uploads`, { method: "POST", body: form });
  } catch {
    throw new ApiError("Serverga ulanib bo'lmadi", 0);
  }
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new ApiError(data.error ?? "Faylni yuklab bo'lmadi", res.status);
  }
  return data.url;
}

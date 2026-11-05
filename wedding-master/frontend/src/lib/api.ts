import { BASE, withBase } from "./base";

/** API manzili: alohida domen berilmasa, sayt joylashgan yo'l ("" yoki "/erbotayev"). */
export const API_URL = import.meta.env.VITE_API_URL || BASE.replace(/\/$/, "");
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

/**
 * Yuklangan rasmning qaysi o'lchami kerak: server shu kenglikdagi WebP
 * variantini beradi (backend'dagi VARIANT_WIDTHS bilan bir xil bo'lsin).
 * Masalan, galereya katakchasiga 1920 px'lik asl rasm o'rniga 640 px.
 */
export const PHOTO_WIDTHS = { thumb: 640, card: 1000, hero: 1600 } as const;

/**
 * Saqlangan rasm/musiqa yo'llarini to'liq manzilga aylantiradi: yuklanganlar
 * (/uploads/...) API'dan, kutubxonadagi umumiy fayllar (/templates/...) saytdan.
 * `width` faqat yuklangan rasmlarga ta'sir qiladi (statik fayllar tayyor o'lchamda).
 */
export function mediaUrl(path: string, width?: number): string {
  if (!path || /^https?:\/\//.test(path)) return path;
  if (path.startsWith("/uploads/")) {
    return width && /\.(jpe?g|png|webp)$/i.test(path) ? `${API_URL}${path}?w=${width}` : `${API_URL}${path}`;
  }
  return path.startsWith("/") ? withBase(path) : path;
}

export async function api<T>(
  path: string,
  /** token: berilsa foydalanuvchi tokeni o'rniga ishlatiladi ("" — tokensiz) */
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = options.token !== undefined ? options.token : getToken();
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

/**
 * Faylni yuklaydi. XMLHttpRequest — fetch yuborish jarayonini ko'rsatmaydi, server
 * uzoq bo'lgani uchun esa katta fayl sekin ketadi. onProgress: 0..1; 1 dan keyin
 * server faylni saqlayotgan bo'ladi.
 */
export function uploadFile(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/uploads`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onerror = () => reject(new ApiError("Serverga ulanib bo'lmadi", 0));
    xhr.onload = () => {
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText) as typeof data;
      } catch {
        /* Javob JSON emas — pastda umumiy xato */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url);
      else reject(new ApiError(data.error ?? "Faylni yuklab bo'lmadi", xhr.status));
    };
    xhr.send(form);
  });
}

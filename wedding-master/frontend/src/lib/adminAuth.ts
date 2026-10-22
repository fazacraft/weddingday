import { api } from "./api";

/**
 * /admin paneli uchun login/parol bilan olingan alohida token. Oddiy
 * foydalanuvchi sessiyasiga aralashmaydi; bo'lmasa (admin email bilan kirgan
 * bo'lsa) foydalanuvchi tokeni ishlatiladi.
 */
const ADMIN_TOKEN_KEY = "fz-admin-token";

export function getAdminToken(): string | null {
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* localStorage yo'q — token faqat shu sahifa davomida */
  }
}

export function adminApi<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  return api<T>(path, { ...options, token: getAdminToken() ?? undefined });
}

export async function adminLogin(username: string, password: string): Promise<void> {
  const { token } = await api<{ token: string }>("/admin/login", {
    method: "POST",
    body: { username, password },
    token: "",
  });
  setAdminToken(token);
}

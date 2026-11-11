import { api } from "./api";

/*
 * Google Identity Services: rasmiy "Google bilan kirish" tugmasi. Skript faqat
 * kirish sahifasida yuklanadi; Client ID serverdan keladi (bo'sh — tugma yo'q).
 */

interface GoogleId {
  initialize(options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: "popup" }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT_URL = "https://accounts.google.com/gsi/client";
let scriptLoading: Promise<GoogleId> | null = null;
let clientIdLoading: Promise<string | null> | null = null;

export function googleClientId(): Promise<string | null> {
  clientIdLoading ??= api<{ googleClientId: string | null }>("/auth/config", { token: "" })
    .then((config) => config.googleClientId)
    .catch(() => null);
  return clientIdLoading;
}

export function loadGoogle(): Promise<GoogleId> {
  scriptLoading ??= new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error("Google yuklanmadi")));
    script.onerror = () => {
      // Keyingi safar yana urinib ko'riladi
      scriptLoading = null;
      reject(new Error("Google yuklanmadi"));
    };
    document.head.appendChild(script);
  });
  return scriptLoading;
}

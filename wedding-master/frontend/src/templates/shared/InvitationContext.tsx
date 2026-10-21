import { createContext, ReactNode, useContext, useMemo } from "react";
import {
  InvitationData,
  greetingParagraphs,
  weddingIso,
} from "../../types/invitation";
import { mediaUrl } from "../../lib/api";

/**
 * live    — haqiqiy mehmon sahifasi (API, socket, ochilish hisobi)
 * preview — wizard/kabinetdagi jonli ko'rinish (hech narsa saqlanmaydi)
 * demo    — landingdagi shablon namunasi
 */
export type TemplateMode = "live" | "preview" | "demo";

export interface InvitationView {
  data: InvitationData;
  id?: string;
  mode: TemplateMode;
  /** Shablon ichki havolalari uchun (masalan, barcha tilaklar sahifasi). */
  basePath: string;
  weddingAt: string;
  paragraphs: string[];
  couplePhoto: string;
  musicUrl: string;
  guestName: string;
}

const InvitationContext = createContext<InvitationView | null>(null);

interface ProviderProps {
  data: InvitationData;
  id?: string;
  mode: TemplateMode;
  basePath: string;
  defaultMusic: string;
  children: ReactNode;
}

export function InvitationProvider({
  data,
  id,
  mode,
  basePath,
  defaultMusic,
  children,
}: ProviderProps) {
  const value = useMemo<InvitationView>(() => {
    const guestName =
      new URLSearchParams(window.location.search).get("name")?.trim() ?? "";
    return {
      data,
      id,
      mode,
      basePath,
      weddingAt: weddingIso(data),
      paragraphs: greetingParagraphs(data.greetingMessage),
      couplePhoto: mediaUrl(data.couplePhoto),
      musicUrl: mediaUrl(data.musicUrl) || defaultMusic,
      guestName,
    };
  }, [data, id, mode, basePath, defaultMusic]);

  return (
    <InvitationContext.Provider value={value}>
      {children}
    </InvitationContext.Provider>
  );
}

export function useInvitation(): InvitationView {
  const ctx = useContext(InvitationContext);
  if (!ctx) throw new Error("useInvitation must be used within InvitationProvider");
  return ctx;
}

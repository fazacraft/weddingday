import { EMPTY_INVITATION, type InvitationData } from "../types/invitation";

export const CREATE_DRAFT_KEY = "fz-draft";
export const editDraftKey = (id: string) => `fz-edit-${id}`;

interface StoredDraft {
  data: InvitationData;
  step: number;
}

/** Saqlangan qoralamani o'qiydi; eski versiyada yo'q maydonlar standart qiymat bilan to'ldiriladi. */
export function loadDraft(key: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed.data) return null;
    return {
      step: typeof parsed.step === "number" ? parsed.step : 0,
      data: {
        ...EMPTY_INVITATION,
        ...parsed.data,
        features: { ...EMPTY_INVITATION.features, ...parsed.data.features },
      },
    };
  } catch {
    return null;
  }
}

export function saveDraft(key: string, data: InvitationData, step: number): void {
  try {
    window.localStorage.setItem(key, JSON.stringify({ data, step }));
  } catch {
    /* localStorage to'lgan yoki yopiq — jonli ko'rinish yangilanmaydi, xolos */
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* e'tiborsiz */
  }
}

/** Server javobidan faqat tahrirlanadigan maydonlarni ajratib oladi. */
export function toInvitationData(source: Partial<InvitationData>): InvitationData {
  const out = { ...EMPTY_INVITATION };
  for (const key of Object.keys(EMPTY_INVITATION) as (keyof InvitationData)[]) {
    if (source[key] !== undefined) (out as Record<string, unknown>)[key] = source[key];
  }
  out.features = { ...EMPTY_INVITATION.features, ...source.features };
  return out;
}

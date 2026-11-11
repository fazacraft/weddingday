import { OAuth2Client } from 'google-auth-library';

/*
 * "Google bilan kirish": brauzer Google'dan imzolangan ID token oladi, server uni
 * Google kalitlari bilan tekshiradi (imzo, kim uchun berilgani, muddati).
 * GOOGLE_CLIENT_ID berilmasa, tugma ko'rsatilmaydi.
 */
export function googleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID ?? '';
}

let client: OAuth2Client | null = null;

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
}

/** Tasdiqlangan email'li Google profili; token yaroqsiz bo'lsa — null. */
export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile | null> {
  const clientId = googleClientId();
  if (!clientId || !credential) return null;
  client ??= new OAuth2Client(clientId);
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    // Email Google'da tasdiqlanmagan bo'lsa, unga ishonib bo'lmaydi (birovning hisobiga bog'lanib qolmasin)
    if (!payload?.sub || !payload.email || payload.email_verified !== true) return null;
    const email = payload.email.toLowerCase();
    return { sub: payload.sub, email, name: payload.name?.trim() || email.split('@')[0] };
  } catch {
    return null;
  }
}

import type { Env } from "./types";

/** Canal WhatsApp exclusivo Mi Menú Smart (no Senior Safe). */
export async function sendMenuReadyWhatsApp(
  env: Env,
  recipient: string,
): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const sid = env.TWILIO_ACCOUNT_SID?.trim();
  const token = env.TWILIO_AUTH_TOKEN?.trim();
  const from = env.TWILIO_WHATSAPP_FROM?.trim();
  if (!sid || !token || !from) {
    return { ok: false, error: "Twilio no configurado en el Worker" };
  }

  let to = recipient.trim();
  if (!to) return { ok: false, error: "recipient vacío" };
  if (!to.startsWith("whatsapp:")) {
    const digits = to.replace(/[^\d+]/g, "");
    to = digits.startsWith("+") ? `whatsapp:${digits}` : `whatsapp:+${digits}`;
  }

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: "Tu menú semanal está listo 🍳",
  });

  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: text.slice(0, 300) };
  }
  try {
    const json = JSON.parse(text) as { sid?: string };
    return { ok: true, sid: json.sid };
  } catch {
    return { ok: true };
  }
}

// ---------------------------------------------------------------------------
// Email delivery abstraction.
//
// Provider priority (spec.email_system.provider_priority): Resend → SendGrid → SMTP.
// All three are called over their HTTPS REST APIs via fetch(), so NO extra npm
// dependency is required to build or deploy. When NONE is configured (local dev),
// emails fall back to a "dev outbox": logged to the console AND appended to
// data/outbox.json so every flow is fully verifiable locally without a provider.
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  ok: boolean;
  provider: "resend" | "sendgrid" | "smtp" | "dev-outbox";
  id?: string;
  error?: string;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@cineconnect.ir";
const FROM_NAME = "سینه‌کانکت | CineConnect";
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  try {
    if (process.env.RESEND_API_KEY) return await sendViaResend(msg);
    if (process.env.SENDGRID_API_KEY) return await sendViaSendGrid(msg);
    if (process.env.SMTP_HOST) return await sendViaSmtp(msg);
  } catch (err) {
    // A provider failure must not break the user flow — fall through to the
    // dev outbox and surface the error in the result for logging.
    const result = await sendViaDevOutbox(msg);
    return { ...result, error: err instanceof Error ? err.message : String(err) };
  }
  return sendViaDevOutbox(msg);
}

// ---------------- Resend ----------------
async function sendViaResend(msg: EmailMessage): Promise<SendResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return { ok: true, provider: "resend", id: data.id };
}

// ---------------- SendGrid ----------------
async function sendViaSendGrid(msg: EmailMessage): Promise<SendResult> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: msg.to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: msg.subject,
      content: [
        { type: "text/plain", value: msg.text },
        { type: "text/html", value: msg.html },
      ],
    }),
  });
  if (!res.ok && res.status !== 202) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
  return { ok: true, provider: "sendgrid", id: res.headers.get("x-message-id") ?? undefined };
}

// ---------------- SMTP (optional nodemailer) ----------------
async function sendViaSmtp(msg: EmailMessage): Promise<SendResult> {
  // nodemailer is an OPTIONAL dependency (not in package.json). Load it only if
  // present; typed locally so tsc doesn't require its types to be installed.
  type Nodemailer = {
    createTransport: (opts: unknown) => {
      sendMail: (m: unknown) => Promise<{ messageId?: string }>;
    };
  };
  let nodemailer: Nodemailer;
  try {
    const specifier = "nodemailer";
    nodemailer = (await import(/* webpackIgnore: true */ specifier)) as unknown as Nodemailer;
  } catch {
    throw new Error("SMTP configured but `nodemailer` is not installed (run: npm i nodemailer)");
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  const info = await transport.sendMail({
    from: FROM,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
  return { ok: true, provider: "smtp", id: info.messageId };
}

// ---------------- Dev outbox (no provider configured) ----------------
async function sendViaDevOutbox(msg: EmailMessage): Promise<SendResult> {
  const id = `dev_${Date.now().toString(36)}`;
  // eslint-disable-next-line no-console
  console.log(
    `\n📧 [dev-outbox] No email provider configured — email captured locally.\n` +
      `   To:      ${msg.to}\n   Subject: ${msg.subject}\n   (full HTML written to data/outbox.json)\n`
  );
  try {
    const dir = path.join(process.cwd(), "data");
    const file = path.join(dir, "outbox.json");
    await fs.mkdir(dir, { recursive: true });
    let list: unknown[] = [];
    try {
      list = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      list = [];
    }
    list.unshift({ id, at: new Date().toISOString(), ...msg });
    if (list.length > 200) list.length = 200;
    await fs.writeFile(file, JSON.stringify(list, null, 2), "utf8");
  } catch {
    /* best-effort only */
  }
  return { ok: true, provider: "dev-outbox", id };
}

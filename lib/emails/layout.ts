// Shared, email-client-safe bilingual shell for all CineConnect transactional
// emails. Inline styles + table layout for maximum client compatibility.
// Brand: #0D0D0D background, #C9A84C gold, #1A1A2E panel, #FFFFFF text.

export interface EmailColumn {
  heading: string;
  lines: string[]; // plain strings; rendered as <p>
  button?: { label: string; url: string };
  muted?: string; // small print under the column
}

export interface BilingualEmailInput {
  preheader: string; // hidden preview text
  fa: EmailColumn;
  en: EmailColumn;
}

const GOLD = "#C9A84C";
const BG = "#0D0D0D";
const PANEL = "#1A1A2E";
const TEXT = "#FFFFFF";
const MUTED = "#9aa0aa";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function button(b: { label: string; url: string }): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;">
      <tr><td style="border-radius:8px;background:${GOLD};">
        <a href="${esc(b.url)}" target="_blank"
           style="display:inline-block;padding:12px 28px;font-weight:700;color:#0D0D0D;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">
          ${esc(b.label)}
        </a>
      </td></tr>
    </table>`;
}

function column(col: EmailColumn, dir: "rtl" | "ltr"): string {
  const align = dir === "rtl" ? "right" : "left";
  const lines = col.lines
    .map(
      (l) =>
        `<p style="margin:0 0 12px;color:${TEXT};font-size:15px;line-height:1.8;opacity:.92;">${esc(l)}</p>`
    )
    .join("");
  return `
    <div dir="${dir}" style="text-align:${align};">
      <h2 style="margin:0 0 14px;color:${GOLD};font-size:18px;font-weight:700;">${esc(col.heading)}</h2>
      ${lines}
      ${col.button ? button(col.button) : ""}
      ${col.muted ? `<p style="margin:8px 0 0;color:${MUTED};font-size:12px;line-height:1.6;">${esc(col.muted)}</p>` : ""}
    </div>`;
}

export function renderBilingualEmail(input: BilingualEmailInput): string {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>CineConnect</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${esc(input.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${PANEL};border:1px solid rgba(201,168,76,.25);border-radius:16px;overflow:hidden;font-family:Tahoma,Arial,Helvetica,sans-serif;">
        <tr><td style="padding:26px 30px 8px;text-align:center;border-bottom:1px solid rgba(255,255,255,.08);">
          <span style="font-size:22px;font-weight:800;letter-spacing:.5px;color:${GOLD};">CineConnect</span>
          <span style="display:block;margin-top:2px;color:${MUTED};font-size:13px;">سینه‌کانکت — جایی که استعداد، فرصت پیدا می‌کند</span>
        </td></tr>
        <tr><td style="padding:26px 30px;">
          ${column(input.fa, "rtl")}
          <div style="height:1px;background:rgba(255,255,255,.1);margin:22px 0;"></div>
          ${column(input.en, "ltr")}
        </td></tr>
        <tr><td style="padding:16px 30px 26px;border-top:1px solid rgba(255,255,255,.08);text-align:center;">
          <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.7;">
            © ${new Date().getFullYear()} CineConnect · سینه‌کانکت<br/>
            این پیام به‌صورت خودکار ارسال شده است · This is an automated message.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Plain-text fallback assembled from both columns.
export function renderBilingualText(input: BilingualEmailInput): string {
  const part = (c: EmailColumn) =>
    [c.heading, "", ...c.lines, c.button ? `${c.button.label}: ${c.button.url}` : "", c.muted ?? ""]
      .filter((x) => x !== undefined)
      .join("\n");
  return `${part(input.fa)}\n\n----------------------------------------\n\n${part(input.en)}\n`;
}

// Security notification emails shared by the reset + change password flows.
import { sendEmail } from "./email";
import { passwordChangedEmail } from "./emails/templates/password-changed";

export async function notifyPasswordChanged(email: string, ip: string, base: string): Promise<void> {
  const d = new Date();
  const whenEn = d.toUTCString();
  let whenFa: string;
  try {
    whenFa = new Intl.DateTimeFormat("fa-IR", { dateStyle: "full", timeStyle: "short" }).format(d);
  } catch {
    whenFa = d.toISOString();
  }
  await sendEmail({
    to: email,
    ...passwordChangedEmail({ whenFa, whenEn, ip, supportUrl: `${base}/contact` }),
  });
}

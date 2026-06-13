import { clearSession, getSession } from "@/lib/auth";
import { audit } from "@/lib/security";
import { clientIp } from "@/lib/rate-limit";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

// Logout: invalidate the session SERVER-SIDE (removes the session row so the
// token can never be replayed) and clear the HttpOnly cookies.
export async function POST(req: Request) {
  const s = await getSession();
  await clearSession(s?.sid);
  if (s) await audit("logout", "", s.sub, clientIp(req));
  return ok();
}

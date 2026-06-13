import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import type { Role } from "./types";
import { mutate, readDB, uid } from "./db";
import { hashToken } from "./auth-helpers";

// Password hashing now lives in lib/password.ts (Argon2id-preferred, bcrypt
// fallback). Re-exported so existing `from "@/lib/auth"` imports keep working.
export { hashPassword, verifyPassword } from "./password";

// ---- Secrets (env-driven; dev fallbacks so the app runs out of the box) ----
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET ||
    "dev-only-cineconnect-jwt-secret-change-in-production-0123456789"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_SECRET ||
    "dev-only-cineconnect-refresh-secret-change-me-9876543210abcd"
);
// 32-byte key for AES-256-GCM National-ID encryption at rest.
const NID_KEY = crypto
  .createHash("sha256")
  .update(process.env.NID_ENC_KEY || "dev-only-national-id-encryption-key-change-me")
  .digest();

const ACCESS_COOKIE = "cc_access";
const REFRESH_COOKIE = "cc_refresh";
const ACCESS_TTL_SECONDS = 20 * 60; // short-lived access token

const SESSION_SECONDS = Number(process.env.SESSION_MAX_AGE_SECONDS) || 86400; // 24h
const REMEMBER_SECONDS = Number(process.env.SESSION_REMEMBER_ME_SECONDS) || 2592000; // 30d

// What callers provide to open a session.
export interface SessionClaims {
  sub: string; // userId
  role: Role;
  name: string;
  email: string;
}
// What a decoded session token carries (claims + server-side session id).
export interface TokenPayload extends SessionClaims {
  sid: string;
}

export interface SessionOptions {
  remember?: boolean;
  ip?: string;
  userAgent?: string;
}

// ---------------- Security answers (bcrypt) ----------------
export async function hashSecurityAnswer(ans: string) {
  return bcrypt.hash(ans.trim().toLowerCase(), 10);
}
export async function verifySecurityAnswer(ans: string, hash: string) {
  return bcrypt.compare(ans.trim().toLowerCase(), hash);
}

// ---------------- National ID encryption (AES-256-GCM) ----------------
// Per spec: National ID is encrypted at rest and NEVER returned in any response.
export function encryptNationalId(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", NID_KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}
export function decryptNationalId(blob: string): string {
  const [ivB, tagB, dataB] = blob.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", NID_KEY, Buffer.from(ivB, "base64"));
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  return decipher.update(Buffer.from(dataB, "base64")) + decipher.final("utf8");
}

// ---------------- JWT access + refresh tokens ----------------
async function signAccess(payload: TokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(JWT_SECRET);
}
async function signRefresh(payload: TokenPayload, ttlSeconds: number) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(REFRESH_SECRET);
}
async function verifyAccess(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
async function verifyRefresh(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ---------------- HttpOnly cookie session (NEVER localStorage) ----------------
// SameSite=Lax (not Strict): Strict would drop the cookie on the return leg of
// an OAuth redirect and on inbound email links. Lax still blocks CSRF on unsafe
// cross-site requests, which is what matters here. (See AUTH_SETUP.md.)
const cookieBase = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Open a session: register it server-side (so it can be invalidated), then set
// the HttpOnly access + refresh cookies.
export async function setSession(claims: SessionClaims, opts: SessionOptions = {}): Promise<string> {
  const sid = crypto.randomUUID();
  const payload: TokenPayload = { ...claims, sid };
  const ttl = opts.remember ? REMEMBER_SECONDS : SESSION_SECONDS;

  const [access, refresh] = await Promise.all([
    signAccess(payload),
    signRefresh(payload, ttl),
  ]);

  await mutate((db) => {
    db.sessions.push({
      id: sid,
      userId: claims.sub,
      token_hash: hashToken(refresh),
      expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
      ip_address: opts.ip,
      user_agent: opts.userAgent,
      created_at: new Date().toISOString(),
    });
  });

  const jar = cookies();
  jar.set(ACCESS_COOKIE, access, { ...cookieBase, maxAge: Math.min(ACCESS_TTL_SECONDS, ttl) });
  jar.set(REFRESH_COOKIE, refresh, { ...cookieBase, maxAge: ttl });
  return sid;
}

// Clear cookies AND remove the server-side session row (true logout).
export async function clearSession(sid?: string): Promise<void> {
  const jar = cookies();
  const knownSid = sid ?? (await currentSid());
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  if (knownSid) {
    await mutate((db) => {
      db.sessions = db.sessions.filter((s) => s.id !== knownSid);
    });
  }
}

async function currentSid(): Promise<string | undefined> {
  const jar = cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) {
    const p = await verifyAccess(access);
    if (p?.sid) return p.sid;
  }
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    const p = await verifyRefresh(refresh);
    if (p?.sid) return p.sid;
  }
  return undefined;
}

async function sessionRowValid(sid: string): Promise<boolean> {
  const db = await readDB();
  const row = db.sessions.find((s) => s.id === sid);
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) return false;
  return true;
}

// Resolve the current session. Validates the token AND that its server-side row
// still exists (so logout / password-change invalidation is honoured), and
// transparently re-issues the short-lived access token from the refresh token.
export async function getSession(): Promise<TokenPayload | null> {
  const jar = cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) {
    const p = await verifyAccess(access);
    if (p?.sid && (await sessionRowValid(p.sid))) return p;
  }

  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    const p = await verifyRefresh(refresh);
    if (p?.sid && (await sessionRowValid(p.sid))) {
      // Bind the cookie to its row: the presented refresh token must match.
      const db = await readDB();
      const row = db.sessions.find((s) => s.id === p.sid);
      if (row && row.token_hash === hashToken(refresh)) {
        const payload: TokenPayload = { sub: p.sub, role: p.role, name: p.name, email: p.email, sid: p.sid };
        const fresh = await signAccess(payload); // rotate the access token only
        jar.set(ACCESS_COOKIE, fresh, { ...cookieBase, maxAge: ACCESS_TTL_SECONDS });
        return payload;
      }
    }
  }
  return null;
}

export async function requireRole(...roles: Role[]): Promise<TokenPayload | null> {
  const s = await getSession();
  if (!s) return null;
  if (roles.length && !roles.includes(s.role)) return null;
  return s;
}

// ---------------- Session invalidation ----------------
// Spec: invalidate ALL sessions on password change / reset.
export async function invalidateAllSessions(userId: string): Promise<void> {
  await mutate((db) => {
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
  });
}

// Spec: change-password invalidates all OTHER sessions (keeps the current one).
export async function invalidateOtherSessions(userId: string, keepSid: string): Promise<void> {
  await mutate((db) => {
    db.sessions = db.sessions.filter((s) => s.userId !== userId || s.id === keepSid);
  });
}

// Drop expired session rows (called opportunistically from auth routes).
export async function pruneExpiredSessions(): Promise<void> {
  const now = Date.now();
  await mutate((db) => {
    db.sessions = db.sessions.filter((s) => new Date(s.expires_at).getTime() >= now);
  });
}

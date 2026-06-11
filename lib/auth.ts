import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import type { Role } from "./types";

// ---- Secrets (env-driven; dev fallbacks so the app runs out of the box) ----
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-cineconnect-jwt-secret-change-in-production-0123456789"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_SECRET || "dev-only-cineconnect-refresh-secret-change-me-9876543210abcd"
);
// 32-byte key for AES-256-GCM National-ID encryption at rest.
const NID_KEY = crypto
  .createHash("sha256")
  .update(process.env.NID_ENC_KEY || "dev-only-national-id-encryption-key-change-me")
  .digest();

const ACCESS_COOKIE = "cc_access";
const REFRESH_COOKIE = "cc_refresh";

export interface TokenPayload {
  sub: string; // userId
  role: Role;
  name: string;
  email: string;
}

// ---------------- Passwords & security answers (bcrypt) ----------------
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}
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
export async function signAccess(payload: TokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m") // short-lived access token
    .sign(JWT_SECRET);
}
export async function signRefresh(payload: TokenPayload) {
  return new SignJWT({ ...payload, jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(REFRESH_SECRET);
}
export async function verifyAccess(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
export async function verifyRefresh(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ---------------- HttpOnly cookie session (NEVER localStorage) ----------------
const cookieBase = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setSession(payload: TokenPayload) {
  const [access, refresh] = await Promise.all([signAccess(payload), signRefresh(payload)]);
  const jar = cookies();
  jar.set(ACCESS_COOKIE, access, { ...cookieBase, maxAge: 20 * 60 });
  jar.set(REFRESH_COOKIE, refresh, { ...cookieBase, maxAge: 7 * 24 * 3600 });
}

export function clearSession() {
  const jar = cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

// Resolve the current session, transparently rotating the refresh token.
export async function getSession(): Promise<TokenPayload | null> {
  const jar = cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) {
    const p = await verifyAccess(access);
    if (p) return p;
  }
  // access expired → try refresh rotation
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    const p = await verifyRefresh(refresh);
    if (p) {
      const payload: TokenPayload = { sub: p.sub, role: p.role, name: p.name, email: p.email };
      await setSession(payload); // rotate
      return payload;
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

// ---------------------------------------------------------------------------
// Password hashing — Argon2id preferred, bcrypt as the always-available fallback.
//
// Spec (security_requirements.password): "Argon2id — memory: 64MB, iterations: 3,
// parallelism: 4" with bcrypt allowed when Argon2 is unavailable.
//
// `argon2` is a native module and is treated as an OPTIONAL dependency so the app
// builds and runs with zero extra installs. When it IS installed (production) and
// AUTH_USE_ARGON2 !== "0", new hashes use Argon2id. Verification always works for
// BOTH formats, so the bcrypt-seeded demo users keep logging in after the upgrade.
// ---------------------------------------------------------------------------

import bcrypt from "bcryptjs";

type Argon2Module = {
  hash: (pw: string, opts: Record<string, unknown>) => Promise<string>;
  verify: (hash: string, pw: string) => Promise<boolean>;
  argon2id: number;
};

let argonLoaded = false;
let argonMod: Argon2Module | null = null;

// Load `argon2` lazily and only if it is actually installed. The variable
// specifier + webpackIgnore keeps Next/webpack from trying to bundle it.
async function loadArgon(): Promise<Argon2Module | null> {
  if (argonLoaded) return argonMod;
  argonLoaded = true;
  if (process.env.AUTH_USE_ARGON2 === "0") return (argonMod = null);
  try {
    const specifier = "argon2";
    const mod = (await import(/* webpackIgnore: true */ specifier)) as unknown as
      | Argon2Module
      | { default: Argon2Module };
    argonMod = ("hash" in mod ? mod : (mod as { default: Argon2Module }).default) ?? null;
  } catch {
    argonMod = null; // not installed → use bcrypt
  }
  return argonMod;
}

const BCRYPT_COST = 12;

const ARGON_OPTS = {
  type: undefined as unknown as number, // set to argon2id below
  memoryCost: Number(process.env.ARGON2_MEMORY_COST) || 65536, // 64 MB
  timeCost: Number(process.env.ARGON2_TIME_COST) || 3,
  parallelism: Number(process.env.ARGON2_PARALLELISM) || 4,
};

export async function hashPassword(plain: string): Promise<string> {
  const argon = await loadArgon();
  if (argon) {
    return argon.hash(plain, { ...ARGON_OPTS, type: argon.argon2id });
  }
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  if (hash.startsWith("$argon2")) {
    const argon = await loadArgon();
    if (!argon) return false; // argon hash but module missing — cannot verify
    try {
      return await argon.verify(hash, plain);
    } catch {
      return false;
    }
  }
  // bcrypt ($2a/$2b/$2y...) — covers all seeded + credentials users
  return bcrypt.compare(plain, hash);
}

// A constant-ish dummy compare used on the "user not found" path to blunt
// account-enumeration timing attacks on the login endpoint.
const DUMMY_BCRYPT = "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv";
export async function dummyVerify(plain: string): Promise<void> {
  try {
    await bcrypt.compare(plain, DUMMY_BCRYPT);
  } catch {
    /* ignore */
  }
}

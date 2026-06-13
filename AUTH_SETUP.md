# CineConnect — Authentication Setup

Production-ready auth for CineConnect: email + password, email verification,
password reset / change, brute-force lockout, secure HttpOnly-cookie sessions
with server-side invalidation, and Google / Apple / Microsoft OAuth. All UI,
errors and emails are bilingual (Persian RTL + English).

This implementation **extends the existing app** (custom `jose` JWT cookies +
the `data/store.json` file store) so it runs locally with **zero external
services**, while shipping everything needed to flip to Postgres + real email +
OAuth by configuration only. See "Going to production" below.

---

## 1. Quick start (local)

```bash
cd cineconnect
npm install
npm run seed          # seed admin + creator + 14 players into data/store.json
npm run dev           # http://localhost:3000
```

No `.env` is required to run — `lib/auth.ts` ships dev-only secret fallbacks. A
ready-made `.env.local` (git-ignored) is included with stable dev secrets.

**Seeded logins** (all email-verified):

| Role    | Email                     | Password       |
| ------- | ------------------------- | -------------- |
| Admin   | admin@cineconnect.ir      | `Admin@1234`   |
| Creator | creator@cineconnect.ir    | `Creator@1234` |
| Player  | talent1@cineconnect.ir    | `Talent@1234`  |

### Where do verification / reset emails go?

With **no email provider configured**, every email is captured in a local
**dev outbox**: printed to the dev-server console *and* written to
`data/outbox.json`. Open that file to grab the verification / reset link during
local testing — the full flow works without a provider.

---

## 2. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | prod | Signs the short-lived access token. `openssl rand -base64 32` |
| `REFRESH_SECRET` | prod | Signs the refresh token |
| `NEXTAUTH_SECRET` | prod | Fallback signing secret (also used by OAuth state) |
| `NID_ENC_KEY` | prod | AES-256-GCM key for National-ID encryption at rest |
| `NEXTAUTH_URL` | prod | Public origin; builds email links + OAuth redirect URIs |
| `SESSION_MAX_AGE_SECONDS` | no | Default session TTL (24h) |
| `SESSION_REMEMBER_ME_SECONDS` | no | Remember-me TTL (30d) |
| `EMAIL_FROM` | no | From address (default `noreply@cineconnect.ir`) |
| `RESEND_API_KEY` / `SENDGRID_API_KEY` / `SMTP_*` | no | Email provider (priority Resend → SendGrid → SMTP) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Google OAuth |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` / `MICROSOFT_TENANT` | no | Microsoft OAuth (`MICROSOFT_TENANT` default `common`) |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` | no | Apple OAuth |
| `AUTH_USE_ARGON2`, `ARGON2_*` | no | Argon2id tuning (see Password hashing) |
| `DATABASE_URL`, `PGSSL` | no | Postgres (when migrating off the JSON store) |

Templates: `.env.example`, `.env.production.example`.

---

## 3. Password hashing — Argon2id / bcrypt

Spec calls for **Argon2id** (mem 64 MB, iterations 3, parallelism 4). `argon2`
is a native module and is treated as **optional** so the app builds with no extra
install. Behaviour (`lib/password.ts`):

- If `argon2` is installed and `AUTH_USE_ARGON2 !== "0"` → new hashes use Argon2id.
- Otherwise → bcrypt (cost 12).
- **Verification auto-detects the format**, so bcrypt-seeded users keep working
  after you enable Argon2.

Enable Argon2 in production:

```bash
npm i argon2
# set ARGON2_MEMORY_COST=65536 ARGON2_TIME_COST=3 ARGON2_PARALLELISM=4
```

---

## 4. Email provider setup

Set exactly **one** (priority order Resend → SendGrid → SMTP). Both REST
providers are called over HTTPS via `fetch` — no SDK install needed.

- **Resend** (preferred): create an API key at resend.com, verify your sending
  domain, set `RESEND_API_KEY`. From address must be on the verified domain.
- **SendGrid**: create an API key, verify the sender/domain, set `SENDGRID_API_KEY`.
- **SMTP**: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` **and**
  `npm i nodemailer` (optional dep, loaded lazily).

Templates live in `lib/emails/templates/` (verification, password-reset, welcome,
password-changed). Each is bilingual and uses the brand palette (#0D0D0D /
#C9A84C / #1A1A2E).

---

## 5. OAuth provider setup

Redirect/return URIs (replace `YOUR_DOMAIN`; for local use `http://localhost:3000`):

```
Google     : https://YOUR_DOMAIN/api/auth/callback/google
Microsoft  : https://YOUR_DOMAIN/api/auth/callback/microsoft
Apple      : https://YOUR_DOMAIN/api/auth/callback/apple
```

### Google — https://console.cloud.google.com/
1. Create/select a project → enable the **People API**.
2. APIs & Services → Credentials → **OAuth 2.0 Client ID** → *Web application*.
3. Authorized redirect URIs: add both the localhost and production callback URLs above.
4. Copy the client ID/secret → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### Microsoft — https://portal.azure.com/
1. Azure AD → **App registrations** → New registration.
2. Supported account types: *Accounts in any org directory and personal Microsoft accounts*.
3. Redirect URI (Web): the Microsoft callback URL above.
4. Certificates & secrets → **New client secret** → `MICROSOFT_CLIENT_SECRET`.
5. Copy Application (client) ID → `MICROSOFT_CLIENT_ID`. Keep `MICROSOFT_TENANT=common`.

### Apple — https://developer.apple.com/
1. Identifiers → App ID → enable **Sign In with Apple**.
2. Create a **Services ID** (this is `APPLE_CLIENT_ID`, e.g. `com.yourapp.signin`);
   configure its domain and **Return URL** = the Apple callback above.
3. Keys → create a key with Sign In with Apple → download the `.p8`
   (→ `APPLE_PRIVATE_KEY`, with newlines escaped as `\n`).
4. Note your **Team ID** (`APPLE_TEAM_ID`) and **Key ID** (`APPLE_KEY_ID`).

> Apple posts the callback cross-site (`response_mode=form_post`). The anti-forgery
> cookie therefore needs `SameSite=None; Secure`, which requires **HTTPS** — Apple
> sign-in will not complete over plain `http://localhost`. Google/Microsoft work on
> localhost. The app sets `APPLE_PRIVATE_KEY` into a fresh ES256 client-secret JWT
> on each token exchange; only Apple's `.p8`/Team/Key IDs are stored.

Unconfigured providers are safe: the start route redirects back to
`/login?error=oauth_unconfigured` with a friendly bilingual message.

---

## 6. Database — two backends, chosen by env

`lib/db.ts` selects its backend at runtime:

- **`DATABASE_URL` unset** → local JSON file `data/store.json` (zero-config dev).
- **`DATABASE_URL` set** → **Postgres**, storing the whole DB object as a single
  JSONB row (table `cc_store`, id `main`). This works on serverless (Vercel,
  read-only FS) and is what production uses. The table is **auto-created** on
  first connect — no manual migration step required.

### Provision Neon (recommended)
1. Create a free project at https://neon.tech → copy the **pooled** connection
   string (host contains `-pooler`), e.g.
   `postgres://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`.
2. Seed it (creates the table + demo data):
   ```bash
   DATABASE_URL="postgres://…-pooler…/neondb?sslmode=require" npm run seed
   ```
3. Set the same `DATABASE_URL` in Vercel (and locally to test).

`scripts/migrate.mjs` (runs `db/migrations/000_kv_store.sql`) is optional since
the table auto-creates. The **relational** schema is preserved under
`db/migrations/relational/` (001 auth columns, 002 oauth_accounts, 003 sessions)
for a future full relational port.

> Trade-off of the JSONB backend: each request reads/writes the whole document
> (last-write-wins under heavy concurrent writes). Fine for launch; switch to the
> relational schema for high write concurrency.

---

## 7. Security model (how the spec is met)

- **Sessions**: JWT in `HttpOnly`, `Secure` (prod), `SameSite=Lax` cookies — never
  localStorage. A server-side **session registry** (`sessions`) backs real
  invalidation. *Lax (not Strict)* is a deliberate choice: Strict drops the cookie
  on OAuth return and inbound email links; Lax still blocks cross-site CSRF.
- **Logout** removes the session row (server-side), not just the cookie.
- **Password change** invalidates all **other** sessions; **reset** invalidates
  **all** sessions.
- **Brute force**: 5 failed logins → 15-minute lockout; plus a 20-req/min/IP
  limiter on every auth endpoint (`lib/rate-limit.ts`; swap for Redis in prod).
- **Tokens**: `crypto.randomBytes(32)` hex; only the **SHA-256 hash** is stored;
  compared in constant time.
- **Enumeration**: forgot-password always returns 200; login runs a dummy hash on
  the "user not found" path.
- **Validation**: every body parsed with Zod (`lib/validation/auth.ts`); text
  inputs stripped of `<>`.
- **Headers**: CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options,
  Referrer-Policy in `next.config.mjs`.
- **Unverified users** can't send contact requests (enforced server-side in
  `app/api/talents/[id]/contact/route.ts`); a dashboard banner prompts them to verify.

---

## 8. Local verification checklist

```bash
npx tsc --noEmit      # ✓ zero type errors
npm run lint          # ✓ zero lint errors
npm run build         # ✓ builds all routes/pages
```

Then with `npm run dev`:

1. Register a player/creator → check `data/outbox.json` for the verification email.
2. Open the verification link (`/verify-email?token=…`) → success → welcome email
   appears in the outbox → dashboard banner disappears.
3. Log in with the right password; log in 5× with the wrong one → account locks
   for 15 min (`accountLocked`).
4. Forgot password → reset link in outbox → reset → "password changed" email →
   old sessions invalidated.
5. Change password while signed in → other sessions invalidated.
6. Log out → session removed server-side (cookie can't be replayed).

---

## 9. Going to production (Vercel)

1. Push to GitHub and import into Vercel.
2. Add every variable from `.env.production.example` (real values) to the Vercel
   project. Generate secrets with `openssl rand -base64 32`.
3. Set `NEXTAUTH_URL=https://YOUR_DOMAIN`.
4. In each provider console, add the **production** callback URLs (section 5).
5. Configure your email provider + verified sending domain (section 4).
6. (Recommended) `npm i argon2 pg`, set `DATABASE_URL`, run `node scripts/migrate.mjs`.
7. Deploy. HTTPS is automatic on Vercel.

### Post-deploy verification (needs real credentials)
- [ ] Google OAuth sign-up + sign-in
- [ ] Microsoft OAuth sign-up + sign-in
- [ ] Apple OAuth sign-up + sign-in (HTTPS required)
- [ ] Verification + welcome emails delivered (check spam)
- [ ] Password-reset email delivered, reset completes
- [ ] Session persists across refreshes; logout invalidates server-side

---

## 10. What is verified vs. pending

**Verified in this environment**

- `tsc --noEmit`, `npm run lint`, `npm run build` all pass.
- Email+password flows, verification, reset, change, lockout, session
  invalidation, and the bilingual RTL UI run locally against the dev outbox.

**Pending (require credentials / deploy access not available here)**

- Live Google/Apple/Microsoft OAuth — code-complete; needs provider secrets.
- Real email delivery — code-complete; needs a provider API key.
- Vercel deployment + production verification — follow section 9.

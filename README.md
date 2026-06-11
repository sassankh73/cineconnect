# CineConnect — سینه‌کانکت

**Where Talent Finds Opportunity · جایی که استعداد، فرصت پیدا می‌کند**

A two-sided marketplace / professional talent registry for the Iranian film, television, serial
and short-film industry. Built to the specification in `../cineconnect_prompt.json`.

Persian (RTL) is the default language, with a Persian/English toggle. Cinematic gold-on-charcoal
design, a signature animated film-strip ticker, a 5-step talent registration wizard, creator
browse/contact tools, player & creator dashboards, and a full admin panel.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | **Next.js 14 (App Router)** + **Tailwind CSS** + **Framer Motion** |
| Backend | Next.js **Route Handlers** (Node runtime) |
| Auth | **JWT** access + refresh, **HttpOnly cookies**, refresh-token rotation (`jose` + `bcryptjs`) |
| Data | JSON file store (`lib/db.ts`) mirroring **PostgreSQL** schema in [`db/schema.sql`](db/schema.sql) |
| Fonts | Cinzel (display) · Vazirmatn (Persian) · Inter (Latin) |

> The JSON store lets the app **run with zero external services**. It mirrors `db/schema.sql`
> 1:1, so swapping in real PostgreSQL (`pg`/Prisma) only means re-implementing the accessor
> functions in `lib/db.ts`. File uploads write to `public/uploads/`; in production point these at
> S3-compatible storage (Arvan Cloud) and payments at ZarinPal/IDPay.

## Getting started

```bash
npm install
npm run seed     # creates data/store.json with an admin, a creator and 14 active talents
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build && npm run start
```

### Demo logins (from the seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cineconnect.ir` | `Admin@1234` |
| Creator (Pro) | `creator@cineconnect.ir` | `Creator@1234` |
| Talent | `talent1@cineconnect.ir` | `Talent@1234` |

## Routes

`/` landing · `/talents` browse (creators only) · `/talent/:id` profile · `/register/player`
(5-step wizard) · `/register/creator` · `/login` · `/dashboard/player` · `/dashboard/creator` ·
`/admin` · `/about` · `/contact` · `/faq` · `/terms`

## Security model (enforced server-side)

These spec rules are enforced in the API layer, not just the UI:

- **Profile hidden until paid** — a profile is only `active`/visible once payment is confirmed
  (online gateway auto-confirms; bank transfer waits for admin confirmation within 24h).
- **National ID never exposed** — encrypted at rest (AES-256-GCM) and stripped from every API
  response and projection.
- **Phone gated** — a talent's phone is revealed to a creator **only** after a contact request.
- **Passwords** bcrypt-hashed; **security question** is a bcrypt-hashed second factor.
- **Sessions** are HttpOnly cookies (never localStorage), short-lived access + rotating refresh.
- **Login rate limiting** (brute-force prevention) + **audit log** of logins & profile changes.
- **Security headers** (CSP, HSTS, X-Frame-Options, …) set in `next.config.mjs`.
- **File limits** enforced on **both** client (pre-upload) and server (`/api/upload`).

## Verified behaviours

`npm run build` passes (28 routes). A live smoke test confirmed: 403 browse gate for guests;
creator login; phone & National-ID absent before a contact request and phone-only unlock after;
login rate-limit (429) after 5 attempts; admin endpoint forbidden (403) for creators; and the
payment gate (a registered-but-unpaid profile stays hidden, becomes visible after payment).

## Project layout

```
app/            routes (pages) + api/ route handlers
components/     Header, Footer, FilmStripTicker, TalentCard, fields, motion helpers
lib/            constants, i18n, types, db, auth, security, validation, upload-client
db/schema.sql   PostgreSQL schema (production target)
scripts/seed.mjs  sample data
```

## Production checklist (from the spec)

Set real secrets in `.env.local` (see `.env.example`): `JWT_SECRET`, `REFRESH_SECRET`,
`NID_ENC_KEY`. Wire `DATABASE_URL` (PostgreSQL), S3-compatible storage (Arvan Cloud), and a
payment gateway (ZarinPal/IDPay). Test the payment flow in sandbox, enforce HTTPS, and run a
WCAG-AA accessibility pass.

---

© CineConnect / CinePro. The specification file `cineconnect_prompt.json` is a protected,
read-only artifact and must not be modified.

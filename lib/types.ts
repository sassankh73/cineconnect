// Domain model — mirrors the PostgreSQL schema in db/schema.sql.

export type Role = "player" | "creator" | "admin";

export type ProfileStatus =
  | "pending_payment" // registered, not yet paid → HIDDEN
  | "pending_review"  // bank transfer uploaded, awaiting admin confirm → HIDDEN
  | "active"          // paid/confirmed → VISIBLE
  | "suspended"       // admin action → HIDDEN
  | "expired";        // past 12-month validity → HIDDEN

export interface NotableProject {
  title: string;
  year: string;
  role: string;
  production: string;
}

export interface PhysicalAttributes {
  height_cm?: number;
  weight_kg?: number;
  eye_color?: string;
  hair_color?: string;
  body_type?: string;
}

export interface MediaRefs {
  profile_photo?: string;
  portfolio_photos?: string[];
  video_reel?: string;
  voice_sample?: string;
  cv_pdf?: string;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  // step 2 — personal & professional
  full_name_persian: string;
  full_name_latin: string;
  date_of_birth: string;
  gender: string;
  city: string;
  province: string;
  willing_to_travel: boolean;
  phone: string;            // PROTECTED — never sent to creators without a contact request
  national_id_enc: string;  // ENCRYPTED at rest — never returned in any API response
  primary_profession: string;
  secondary_professions: string[];
  experience_level: string; // tier1..tier4
  years_experience: number;
  education_training: string[];
  education_detail?: string;
  notable_projects: NotableProject[];
  awards?: string;
  union_membership?: string;
  languages_spoken: string[];
  physical_attributes?: PhysicalAttributes;
  special_skills: string[];
  availability: string;
  daily_rate?: string;
  instagram?: string;
  imdb_link?: string;
  website?: string;
  // media
  media: MediaRefs;
  // tier / payment / lifecycle
  tier: number;
  status: ProfileStatus;
  paid_at?: string;
  expires_at?: string;
  view_count: number;
  contact_request_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  full_name: string;
  company?: string;
  role_title?: string;
  plan: "free" | "basic" | "pro";
  contacts_used_this_month: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;          // empty string for OAuth-only accounts (NULL in Postgres)
  role: Role;
  security_question?: string;
  security_answer_hash?: string;
  email_verified: boolean;
  // ---- email verification ----
  verification_token?: string;            // SHA-256 hash of the token (never the plain token)
  verification_token_expiry?: string;     // ISO timestamp
  verification_resend_count?: number;      // resends used in the current UTC day
  verification_resend_day?: string;        // UTC date (YYYY-MM-DD) the counter applies to
  verification_last_sent_at?: string;      // ISO — enforces the resend cooldown
  // ---- password reset ----
  reset_password_token?: string;          // SHA-256 hash of the token
  reset_password_token_expiry?: string;    // ISO timestamp
  // ---- oauth / identity ----
  provider?: "google" | "apple" | "microsoft" | "credentials";
  provider_id?: string;
  full_name_persian?: string;
  full_name_latin?: string;
  avatar_url?: string;
  // ---- account state & brute-force protection ----
  is_active: boolean;
  failed_login_attempts: number;
  lockout_until?: string;                  // ISO — set after too many failed attempts
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

// One row per linked OAuth identity — lets a single user link multiple providers.
export interface OAuthAccount {
  id: string;
  userId: string;
  provider: "google" | "apple" | "microsoft";
  provider_account_id: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  created_at: string;
}

// Server-side session registry — enables real invalidation on logout / password change.
export interface Session {
  id: string;          // the `sid` claim embedded in the JWT
  userId: string;
  token_hash: string;  // SHA-256 of the refresh token (never the raw token)
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  playerId: string;
  tier: number;
  amount_toman: number;
  method: "online_gateway" | "bank_transfer";
  gateway?: string;
  status: "pending" | "confirmed" | "rejected";
  receipt_ref?: string;       // bank transfer receipt upload reference
  confirmed_by?: string;      // admin id
  created_at: string;
  confirmed_at?: string;
}

export interface ContactRequest {
  id: string;
  creatorId: string;
  playerId: string;
  message: string;
  status: "sent" | "viewed" | "responded";
  created_at: string;
}

export interface Bookmark {
  id: string;
  creatorId: string;
  collection: string; // named collection e.g. "Cast for Film X"
  playerId: string;
  created_at: string;
}

export interface Review {
  id: string;
  creatorId: string;
  playerId: string;
  rating: number; // 1..5
  comment: string;
  project?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "contact_request" | "payment_confirmed" | "expiry_reminder" | "system" | "moderation";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  detail: string;
  ip?: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporterId?: string;
  playerId: string;
  reason: string;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
}

// Shape returned to Creators in browse/profile views — phone & national_id ALWAYS stripped.
export type PublicPlayer = Omit<PlayerProfile, "phone" | "national_id_enc"> & {
  contactUnlocked: boolean; // true only after a contact request exists
  phone?: string;           // present only when contactUnlocked
};

import { NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { requireRole, hashPassword, invalidateAllSessions } from "@/lib/auth";
import { audit, clientIp } from "@/lib/security";
import { PROFILE_VALIDITY_MONTHS } from "@/lib/constants";

export const runtime = "nodejs";

// Unified admin action endpoint.
// action ∈  confirm_payment | reject_payment | suspend | unsuspend |
//           resolve_report  | notify         |
//           change_user_password | force_logout_user | delete_user |
//           toggle_email_verified | set_user_role | change_creator_plan |
//           suspend_user | unsuspend_user
export async function POST(req: Request) {
  const admin = await requireRole("admin");
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { action, id, message, userId, newPassword, role, plan, value } = body;
  const ip = clientIp(req);

  const result = await mutate((db) => {
    const now = new Date();

    switch (action) {
      // ────────────────────────────── PAYMENTS ──────────────────────────────
      case "confirm_payment": {
        const pay = db.payments.find((p) => p.id === id);
        if (!pay) return { error: "not_found" };
        pay.status = "confirmed";
        pay.confirmed_by = admin.sub;
        pay.confirmed_at = now.toISOString();
        const player = db.players.find((p) => p.id === pay.playerId);
        if (player) {
          player.status = "active";
          player.paid_at = now.toISOString();
          const exp = new Date(now);
          exp.setMonth(exp.getMonth() + PROFILE_VALIDITY_MONTHS);
          player.expires_at = exp.toISOString();
          db.notifications.unshift({
            id: uid("ntf_"), userId: player.userId, type: "payment_confirmed",
            title: "پرداخت تأیید شد", body: "واریز بانکی شما تأیید و پروفایل فعال شد.",
            read: false, created_at: now.toISOString(),
          });
        }
        return { ok: true };
      }

      case "reject_payment": {
        const pay = db.payments.find((p) => p.id === id);
        if (!pay) return { error: "not_found" };
        pay.status = "rejected";
        const player = db.players.find((p) => p.id === pay.playerId);
        if (player && player.status === "pending_review") player.status = "pending_payment";
        return { ok: true };
      }

      // ──────────────────────────── PLAYER PROFILE ──────────────────────────
      case "suspend": {
        const player = db.players.find((p) => p.id === id);
        if (!player) return { error: "not_found" };
        player.status = "suspended";
        return { ok: true };
      }

      case "unsuspend": {
        const player = db.players.find((p) => p.id === id);
        if (!player) return { error: "not_found" };
        player.status = player.paid_at ? "active" : "pending_payment";
        return { ok: true };
      }

      // ──────────────────────────── USER ACCOUNT ────────────────────────────

      // Suspend / unsuspend at the user-account level (disables login)
      case "suspend_user": {
        const user = db.users.find((u) => u.id === (id || userId));
        if (!user) return { error: "not_found" };
        if (user.role === "admin") return { error: "cannot_suspend_admin" };
        user.is_active = false;
        return { ok: true };
      }

      case "unsuspend_user": {
        const user = db.users.find((u) => u.id === (id || userId));
        if (!user) return { error: "not_found" };
        user.is_active = true;
        user.failed_login_attempts = 0;
        user.lockout_until = undefined;
        return { ok: true };
      }

      // Change password for ANY user (admin sets new password directly)
      case "change_user_password": {
        if (!newPassword || newPassword.length < 8)
          return { error: "رمز عبور باید حداقل ۸ کاراکتر باشد" };
        const user = db.users.find((u) => u.id === (id || userId));
        if (!user) return { error: "not_found" };
        // password_hash will be updated after mutate resolves (async hash)
        // We flag the record with a sentinel, replace in post-hook below.
        // For flat-JSON store we handle hashing outside mutate.
        return { ok: true, _needsHash: true, _userId: user.id };
      }

      // Force-logout — invalidate all sessions for a user
      case "force_logout_user": {
        const target = id || userId;
        const before = db.sessions.length;
        db.sessions = db.sessions.filter((s) => s.userId !== target);
        return { ok: true, sessionsRemoved: before - db.sessions.length };
      }

      // Soft-delete: deactivate account, anonymise identifiers
      case "delete_user": {
        const user = db.users.find((u) => u.id === (id || userId));
        if (!user) return { error: "not_found" };
        if (user.role === "admin") return { error: "cannot_delete_admin" };
        user.is_active = false;
        user.email = `deleted_${user.id}@deleted.local`;
        user.password_hash = "";
        user.security_question = undefined;
        user.security_answer_hash = undefined;
        // Wipe their sessions
        db.sessions = db.sessions.filter((s) => s.userId !== user.id);
        // Suspend player profile
        const player = db.players.find((p) => p.userId === user.id);
        if (player) player.status = "suspended";
        return { ok: true };
      }

      // Toggle email verification flag
      case "toggle_email_verified": {
        const user = db.users.find((u) => u.id === (id || userId));
        if (!user) return { error: "not_found" };
        user.email_verified = typeof value === "boolean" ? value : !user.email_verified;
        return { ok: true, email_verified: user.email_verified };
      }

      // Change a user's role (promote/demote)
      case "set_user_role": {
        const user = db.users.find((u) => u.id === (id || userId));
        if (!user) return { error: "not_found" };
        if (!["player", "creator", "admin"].includes(role))
          return { error: "invalid_role" };
        user.role = role;
        return { ok: true };
      }

      // Change creator subscription plan
      case "change_creator_plan": {
        const creator = db.creators.find((c) => c.id === id);
        if (!creator) return { error: "not_found" };
        if (!["free", "basic", "pro"].includes(plan)) return { error: "invalid_plan" };
        creator.plan = plan;
        return { ok: true };
      }

      // ──────────────────────────── MODERATION ──────────────────────────────
      case "resolve_report": {
        const r = db.reports.find((x) => x.id === id);
        if (!r) return { error: "not_found" };
        r.status = "reviewed";
        return { ok: true };
      }

      case "dismiss_report": {
        const r = db.reports.find((x) => x.id === id);
        if (!r) return { error: "not_found" };
        r.status = "dismissed";
        return { ok: true };
      }

      // ──────────────────────────── CREATOR APPROVAL ───────────────────────
      case "approve_creator": {
        const creator = db.creators.find((c) => c.id === id);
        if (!creator) return { error: "not_found" };
        creator.approval_status = "approved";
        creator.approved_at = now.toISOString();
        // Notify the creator user
        const creatorUser = db.users.find((u) => u.id === creator.userId);
        if (creatorUser) {
          db.notifications.unshift({
            id: uid("ntf_"), userId: creatorUser.id, type: "system",
            title: "حساب شما تأیید شد",
            body: "مدارک شما بررسی و تأیید شد. اکنون می‌توانید به پروفایل بازیگران دسترسی داشته باشید.",
            read: false, created_at: now.toISOString(),
          });
        }
        return { ok: true };
      }

      case "reject_creator": {
        const creator = db.creators.find((c) => c.id === id);
        if (!creator) return { error: "not_found" };
        creator.approval_status = "rejected";
        creator.rejection_reason = String(message || "");
        creator.rejected_at = now.toISOString();
        // Notify the creator user
        const creatorUser = db.users.find((u) => u.id === creator.userId);
        if (creatorUser) {
          db.notifications.unshift({
            id: uid("ntf_"), userId: creatorUser.id, type: "system",
            title: "تأیید حساب رد شد",
            body: message ? `دلیل: ${message}` : "مدارک ارائه‌شده تأیید نشد. لطفاً با پشتیبانی تماس بگیرید.",
            read: false, created_at: now.toISOString(),
          });
        }
        return { ok: true };
      }

      // ─────────────────────────── NOTIFICATIONS ────────────────────────────
      case "notify": {
        const targets = userId ? db.users.filter((u) => u.id === userId) : db.users;
        for (const u of targets) {
          db.notifications.unshift({
            id: uid("ntf_"), userId: u.id, type: "system",
            title: "اطلاعیه سیستم", body: String(message || ""),
            read: false, created_at: now.toISOString(),
          });
        }
        return { ok: true, count: targets.length };
      }

      default:
        return { error: "unknown_action" };
    }
  });

  if (!result) return NextResponse.json({ error: "mutation_failed" }, { status: 500 });
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "not_found" ? 404 : 400 });
  }

  // ── Async post-step: hash new password outside the sync mutate callback ──
  if ((result as Record<string, unknown>)._needsHash) {
    const targetId = (result as Record<string, unknown>)._userId as string;
    const hashed = await hashPassword(newPassword);
    await mutate((db) => {
      const user = db.users.find((u) => u.id === targetId);
      if (user) user.password_hash = hashed;
      return { ok: true };
    });
    // Invalidate all existing sessions so the user must re-login
    await invalidateAllSessions(targetId);
    await audit(`admin_change_user_password`, targetId, admin.sub, ip);
    return NextResponse.json({ ok: true });
  }

  await audit(`admin_${action}`, String(id || userId || ""), admin.sub, ip);
  return NextResponse.json(result);
}

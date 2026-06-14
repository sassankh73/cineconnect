import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

// Admin overview — users, creators, payments queue, reports, audit log, stats.
export async function GET() {
  const admin = await requireRole("admin");
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = await readDB();

  // Strip sensitive fields from users
  const users = db.users.map((u) => {
    const { password_hash, security_answer_hash, reset_password_token, verification_token, ...safe } = u;
    return safe;
  });

  // Strip sensitive fields from creators and enrich with user info
  const creators = db.creators.map((c) => {
    const user = db.users.find((u) => u.id === c.userId);
    return {
      ...c,
      email: user?.email,
      email_verified: user?.email_verified,
      is_active: user?.is_active,
      last_login_at: user?.last_login_at,
      created_at_user: user?.created_at,
    };
  });

  const pendingPayments = db.payments
    .filter((p) => p.status === "pending")
    .map((p) => {
      const player = db.players.find((x) => x.id === p.playerId);
      const user = player ? db.users.find((u) => u.id === player.userId) : undefined;
      return {
        ...p,
        playerName: player?.full_name_persian,
        playerTier: player?.tier,
        playerEmail: user?.email,
      };
    });

  // All payments (for history tab)
  const allPayments = db.payments.map((p) => {
    const player = db.players.find((x) => x.id === p.playerId);
    return {
      ...p,
      playerName: player?.full_name_persian,
      playerTier: player?.tier,
    };
  }).slice(0, 200);

  return NextResponse.json({
    stats: {
      totalUsers: db.users.length,
      players: db.players.length,
      activePlayers: db.players.filter((p) => p.status === "active").length,
      pendingReviewPlayers: db.players.filter((p) => p.status === "pending_review").length,
      suspendedPlayers: db.players.filter((p) => p.status === "suspended").length,
      creators: db.creators.length,
      pendingCreators: db.creators.filter((c) => c.approval_status === "pending").length,
      activeCreators: db.creators.filter((c) => {
        const u = db.users.find((u) => u.id === c.userId);
        return u?.is_active;
      }).length,
      pendingPayments: pendingPayments.length,
      openReports: db.reports.filter((r) => r.status === "open").length,
      totalSessions: db.sessions.length,
    },
    users,
    players: db.players.map(({ national_id_enc, ...p }) => p), // NID always stripped
    creators,
    pendingPayments,
    allPayments,
    reports: db.reports,
    auditLogs: db.auditLogs.slice(0, 500),
  });
}

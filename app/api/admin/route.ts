import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

// Admin overview — users, payments queue, reports, audit log, stats.
export async function GET() {
  const admin = await requireRole("admin");
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = await readDB();

  const users = db.users.map((u) => {
    const { password_hash, security_answer_hash, ...safe } = u;
    return safe;
  });

  const pendingPayments = db.payments
    .filter((p) => p.status === "pending")
    .map((p) => {
      const player = db.players.find((x) => x.id === p.playerId);
      return { ...p, playerName: player?.full_name_persian, playerTier: player?.tier };
    });

  return NextResponse.json({
    stats: {
      players: db.players.length,
      activePlayers: db.players.filter((p) => p.status === "active").length,
      creators: db.creators.length,
      pendingPayments: pendingPayments.length,
      openReports: db.reports.filter((r) => r.status === "open").length,
    },
    users,
    players: db.players.map(({ national_id_enc, ...p }) => p), // NID stripped
    pendingPayments,
    reports: db.reports,
    auditLogs: db.auditLogs.slice(0, 200),
  });
}

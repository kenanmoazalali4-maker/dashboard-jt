import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const FIVEM_URL = process.env.FIVEM_SERVER_URL    || "http://localhost:30120";
const RESOURCE  = process.env.FIVEM_RESOURCE_NAME  || "admin-dashboard";
const API_KEY   = process.env.FIVEM_API_KEY         || "";

async function bridgePost(path: string, body: object) {
  try {
    return await fetch(`${FIVEM_URL}/${RESOURCE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { action, citizenid, serverId, ...extra } = await req.json();

    // ── Give / Remove Money ──────────────────────────────────────────────
    if (action === "give_money" || action === "remove_money") {
      const { moneyType = "cash", amount } = extra;
      const amt = parseInt(amount);
      if (!citizenid || isNaN(amt) || amt <= 0) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT money FROM players WHERE citizenid = ? LIMIT 1`, citizenid
      );
      if (!rows.length) return NextResponse.json({ error: "Player not found" }, { status: 404 });

      let money: any = {};
      try { money = JSON.parse(rows[0].money || "{}"); } catch {}

      const current = parseFloat(money[moneyType] || 0);
      if (action === "give_money") {
        money[moneyType] = current + amt;
      } else {
        money[moneyType] = Math.max(0, current - amt);
      }

      await prisma.$queryRawUnsafe(
        `UPDATE players SET money = ? WHERE citizenid = ?`,
        JSON.stringify(money), citizenid
      );
      return NextResponse.json({ success: true, money });
    }

    // ── Change Job (DB update, takes effect on relog) ─────────────────────
    if (action === "set_job") {
      const { jobName, jobGrade = 0 } = extra;
      if (!citizenid || !jobName) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

      const grade = parseInt(jobGrade) || 0;
      const job = {
        name:         jobName,
        label:        jobName,
        grade:        grade,
        grade_name:   "grade_" + grade,
        grade_label:  "Grade " + grade,
        grade_salary: 50,
        onduty:       true,
        isboss:       grade >= 3,
        type:         "none",
      };

      await prisma.$queryRawUnsafe(
        `UPDATE players SET job = ? WHERE citizenid = ?`,
        JSON.stringify(job), citizenid
      );
      return NextResponse.json({ success: true });
    }

    // ── Change Gang (DB update) ───────────────────────────────────────────
    if (action === "set_gang") {
      const { gangName, gangGrade = 0 } = extra;
      if (!citizenid || !gangName) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

      const grade = parseInt(gangGrade) || 0;
      const gang = {
        name:        gangName,
        label:       gangName,
        grade:       grade,
        grade_name:  "grade_" + grade,
        grade_label: "Grade " + grade,
        isboss:      grade >= 2,
      };

      await prisma.$queryRawUnsafe(
        `UPDATE players SET gang = ? WHERE citizenid = ?`,
        JSON.stringify(gang), citizenid
      );
      return NextResponse.json({ success: true });
    }

    // ── Send Notification (via FiveM bridge) ─────────────────────────────
    if (action === "notify") {
      if (!serverId) return NextResponse.json({ error: "Missing serverId" }, { status: 400 });
      const res = await bridgePost(`/api/players/${serverId}/notify`, { message: extra.message });
      return NextResponse.json({ success: !!res?.ok });
    }

    // ── Give Ammo (via FiveM bridge) ──────────────────────────────────────
    if (action === "give_ammo") {
      if (!serverId) return NextResponse.json({ error: "Missing serverId" }, { status: 400 });
      const res = await bridgePost(`/api/players/${serverId}/ammo`, { weapon: extra.weapon, amount: extra.amount || 100 });
      return NextResponse.json({ success: !!res?.ok });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

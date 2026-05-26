import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FIVEM_URL  = process.env.FIVEM_SERVER_URL   || "http://localhost:30120";
const RESOURCE   = process.env.FIVEM_RESOURCE_NAME || "admin-dashboard";
const API_KEY    = process.env.FIVEM_API_KEY        || "";

const headers = () => ({
  "Content-Type":  "application/json",
  "Authorization": `Bearer ${API_KEY}`,
});

async function bridgeCall(path: string, body?: Record<string, any>) {
  // Append params as query string — FiveM always has request.path even on older builds
  let url = `${FIVEM_URL}/${RESOURCE}${path}`;
  if (body && Object.keys(body).length > 0) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)]))
    ).toString();
    url += `?${qs}`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5000),
  });
  return res;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "online_players") {
      const res = await fetch(`${FIVEM_URL}/players.json`, { cache: "no-store" });
      const rawPlayers = await res.json();
      const players = (rawPlayers || []).map((p: any) => ({
        id:          p.id,
        name:        p.name,
        ping:        p.ping,
        identifiers: p.identifiers || [],
        license:     p.identifiers?.find((i: string) => i.startsWith("license:")) || null,
        discord:     p.identifiers?.find((i: string) => i.startsWith("discord:"))?.replace("discord:", "") || null,
      }));
      return NextResponse.json({ players });
    }

    if (action === "server_status") {
      const [info, players] = await Promise.all([
        fetch(`${FIVEM_URL}/info.json`,    { cache: "no-store" }).then(r => r.json()).catch(() => null),
        fetch(`${FIVEM_URL}/players.json`, { cache: "no-store" }).then(r => r.json()).catch(() => null),
      ]);
      return NextResponse.json({
        online:     true,
        hostname:   info?.vars?.sv_projectName || "Unknown",
        players:    players?.length  || 0,
        maxPlayers: parseInt(info?.vars?.sv_maxClients || "32"),
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, online: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action, serverId, ...extra } = body;

    // ── Bridge actions (require live FiveM connection) ──
    if (action === "kick") {
      const res = await bridgeCall(`/api/players/${serverId}/kick`, { reason: extra.reason });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    if (action === "kill") {
      const res = await bridgeCall(`/api/players/${serverId}/kill`);
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    if (action === "ban") {
      const res = await bridgeCall(`/api/players/${serverId}/ban`, {
        reason: extra.reason, duration: extra.duration || 0, bannedBy: extra.bannedBy || "Dashboard",
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    if (action === "notify" || action === "message") {
      const res = await bridgeCall(`/api/players/${serverId}/notify`, { message: extra.message, type: extra.type || "primary" });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    if (action === "clothes") {
      const res = await bridgeCall(`/api/players/${serverId}/clothes`);
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    if (action === "teleport") {
      const res = await bridgeCall(`/api/players/${serverId}/teleport`, { x: extra.x, y: extra.y, z: extra.z });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    if (action === "set_job") {
      const res = await bridgeCall(`/api/players/${serverId}/job`, { jobName: extra.jobName, gradeLevel: extra.jobGrade || 0 });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    if (action === "set_gang") {
      const res = await bridgeCall(`/api/players/${serverId}/gang`, { gangName: extra.gangName, gradeLevel: extra.gangGrade || 0 });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

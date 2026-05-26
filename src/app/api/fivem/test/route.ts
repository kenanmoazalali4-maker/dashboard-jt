import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FIVEM_URL = process.env.FIVEM_SERVER_URL    || "http://localhost:30120";
const RESOURCE  = process.env.FIVEM_RESOURCE_NAME  || "admin-dashboard";
const API_KEY   = process.env.FIVEM_API_KEY         || "";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results: any = {
    config: { FIVEM_URL, RESOURCE, API_KEY_SET: !!API_KEY },
    tests: {},
  };

  // Test 1: FiveM /players.json (unauthenticated)
  try {
    const r = await fetch(`${FIVEM_URL}/players.json`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    results.tests.players_json = { status: r.status, ok: r.ok };
  } catch (e: any) {
    results.tests.players_json = { error: e.message };
  }

  // Test 2: Bridge status endpoint (authenticated)
  try {
    const r = await fetch(`${FIVEM_URL}/${RESOURCE}/api/server/status`, {
      headers: { "Authorization": `Bearer ${API_KEY}` },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    const body = await r.text();
    results.tests.bridge_status = { status: r.status, ok: r.ok, body: body.substring(0, 200) };
  } catch (e: any) {
    results.tests.bridge_status = { error: e.message };
  }

  // Test 3: Bridge without auth (should return 401)
  try {
    const r = await fetch(`${FIVEM_URL}/${RESOURCE}/api/server/status`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    results.tests.bridge_no_auth = { status: r.status };
  } catch (e: any) {
    results.tests.bridge_no_auth = { error: e.message };
  }

  return NextResponse.json(results);
}

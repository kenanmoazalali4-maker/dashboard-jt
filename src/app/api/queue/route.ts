import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FIVEM_URL = process.env.FIVEM_SERVER_URL || "http://localhost:30120";

// Get queue list
export async function GET() {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${FIVEM_URL}/dashboard-bridge/queue`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ success: false, queue: [], count: 0, error: e.message }, { status: 500 });
  }
}

// Queue actions (skip, remove, setpos)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { action, license, position } = body;

    let endpoint = "";
    switch (action) {
      case "skip":
        endpoint = "/dashboard-bridge/queue/skip";
        break;
      case "remove":
        endpoint = "/dashboard-bridge/queue/remove";
        break;
      case "setpos":
        endpoint = "/dashboard-bridge/queue/setpos";
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const res = await fetch(`${FIVEM_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license, position }),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

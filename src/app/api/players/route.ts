import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const players = await getPlayers(500);
    return NextResponse.json({ players });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

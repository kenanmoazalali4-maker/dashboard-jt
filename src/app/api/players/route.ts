import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const players = await prisma.$queryRawUnsafe("SELECT * FROM players ORDER BY id DESC LIMIT 500");
    return NextResponse.json({ players });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

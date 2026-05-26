import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Update character data
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { citizenid, field, value } = await req.json();
    if (!citizenid || !field) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Fields that are JSON columns
    const jsonFields = ["charinfo", "money", "job", "gang", "metadata", "position"];
    // Fields that are plain columns
    const plainFields = ["name", "citizenid", "cid", "license"];

    if (jsonFields.includes(field)) {
      // Update entire JSON field
      const jsonValue = typeof value === "string" ? value : JSON.stringify(value);
      await prisma.$queryRawUnsafe(
        `UPDATE players SET ${field} = ? WHERE citizenid = ?`,
        jsonValue, citizenid
      );
    } else if (plainFields.includes(field)) {
      await prisma.$queryRawUnsafe(
        `UPDATE players SET ${field} = ? WHERE citizenid = ?`,
        String(value), citizenid
      );
    } else {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Character update error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Delete character
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const citizenid = req.nextUrl.searchParams.get("citizenid");
  if (!citizenid) return NextResponse.json({ error: "Missing citizenid" }, { status: 400 });

  try {
    // Delete related data first
    await prisma.$queryRawUnsafe(`DELETE FROM player_vehicles WHERE citizenid = ?`, citizenid);
    // Delete the character
    await prisma.$queryRawUnsafe(`DELETE FROM players WHERE citizenid = ?`, citizenid);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Character delete error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

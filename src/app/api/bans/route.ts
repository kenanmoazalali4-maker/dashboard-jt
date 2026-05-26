import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Permission } from "@/types";

function hasStaffPermission(staff: any, perm: Permission): boolean {
  if (!staff?.permissions) return false;
  const perms = Array.isArray(staff.permissions) ? staff.permissions : [];
  return perms.includes(Permission.SUPER_ADMIN) || perms.includes(perm);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const staff = (session as any)?.staff;
  if (!hasStaffPermission(staff, Permission.MANAGE_BANS)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, license, reason, duration, bannedBy } = body;

    // expire is unix timestamp (int), 0 or null = permanent
    const expire = duration > 0
      ? Math.floor(Date.now() / 1000) + (duration * 24 * 60 * 60)
      : 2147483647; // far future = permanent

    await prisma.$queryRawUnsafe(
      `INSERT INTO bans (name, license, reason, expire, bannedby) VALUES (?, ?, ?, ?, ?)`,
      name || null,
      license || null,
      reason || "No reason",
      expire,
      bannedBy || staff.username || "Dashboard"
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Ban error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const staff = (session as any)?.staff;
  if (!hasStaffPermission(staff, Permission.MANAGE_BANS)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await prisma.$queryRawUnsafe(`DELETE FROM bans WHERE id = ?`, parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

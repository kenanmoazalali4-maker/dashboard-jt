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
  if (!hasStaffPermission(staff, Permission.MANAGE_STAFF)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { discordId, permissions } = await req.json();
    await prisma.dashboardStaff.create({
      data: { discordId, permissions: JSON.stringify(permissions || []) },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const staff = (session as any)?.staff;
  if (!hasStaffPermission(staff, Permission.MANAGE_STAFF)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, permissions } = await req.json();
    await prisma.dashboardStaff.update({
      where: { id },
      data: {
        permissions: permissions ? JSON.stringify(permissions) : undefined,
      },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const staff = (session as any)?.staff;
  if (!hasStaffPermission(staff, Permission.MANAGE_STAFF)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await prisma.dashboardStaff.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

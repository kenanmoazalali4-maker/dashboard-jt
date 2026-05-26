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
  if (!hasStaffPermission(staff, Permission.MANAGE_SETTINGS)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await req.json();

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string" && value.trim()) {
        await prisma.dashboardSettings.upsert({
          where: { keyName: key },
          update: { value: value as string },
          create: { keyName: key, value: value as string },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

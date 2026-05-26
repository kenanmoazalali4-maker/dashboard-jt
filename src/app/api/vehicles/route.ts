import { NextRequest, NextResponse } from "next/server";
import { deleteVehicle } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await deleteVehicle(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

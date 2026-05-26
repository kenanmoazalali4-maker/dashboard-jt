import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Add vehicle to player garage
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { citizenid, vehicle, plate, garage } = await req.json();
    if (!citizenid || !vehicle) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Generate plate if not provided
    const finalPlate = plate || generatePlate();
    const finalGarage = garage || "pillboxgarage";

    await prisma.$queryRawUnsafe(
      `INSERT INTO player_vehicles (citizenid, vehicle, plate, garage, fuel, engine, body, state) VALUES (?, ?, ?, ?, 100, 1000.0, 1000.0, 1)`,
      citizenid, vehicle, finalPlate, finalGarage
    );

    return NextResponse.json({ success: true, plate: finalPlate });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function generatePlate() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let plate = "";
  for (let i = 0; i < 8; i++) {
    plate += chars[Math.floor(Math.random() * chars.length)];
  }
  return plate;
}

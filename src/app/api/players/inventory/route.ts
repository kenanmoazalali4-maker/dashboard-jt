import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const FIVEM_URL = process.env.FIVEM_SERVER_URL || "http://localhost:30120";

// Get player inventory from database
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const citizenid = req.nextUrl.searchParams.get("citizenid");
  if (!citizenid) return NextResponse.json({ error: "Missing citizenid" }, { status: 400 });

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT inventory FROM players WHERE citizenid = ? LIMIT 1`,
      citizenid
    );

    if (!rows.length) return NextResponse.json({ inventory: [] });

    let inventory: any[] = [];
    try {
      const raw = rows[0].inventory ? JSON.parse(rows[0].inventory) : {};
      if (Array.isArray(raw)) {
        inventory = raw
          .map((item: any, idx: number) => item ? { ...item, slot: item.slot ?? idx + 1, label: item.label || item.name, amount: item.amount || 1 } : null)
          .filter(Boolean);
      } else if (typeof raw === "object") {
        inventory = Object.entries(raw)
          .filter(([_, v]) => v)
          .map(([slot, item]: [string, any]) => ({
            slot: parseInt(slot),
            name: item.name,
            label: item.label || item.name,
            amount: item.amount || 1,
            info: item.info || {},
            weight: item.weight || 0,
          }));
      }
    } catch {}

    return NextResponse.json({ inventory });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Delete item from player inventory (DB + real-time via FiveM)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { citizenid, slot, itemName: providedItemName, amount: providedAmount } = await req.json();
    if (!citizenid || slot === undefined) return NextResponse.json({ error: "Missing citizenid or slot" }, { status: 400 });

    // Read current inventory
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT inventory FROM players WHERE citizenid = ? LIMIT 1`,
      citizenid
    );

    if (!rows.length) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    let rawInventory: any = {};
    try {
      rawInventory = rows[0].inventory ? JSON.parse(rows[0].inventory) : {};
    } catch {
      return NextResponse.json({ error: "Failed to parse inventory" }, { status: 500 });
    }

    // Find item info - prefer values from request body, fallback to DB lookup
    let itemName = providedItemName || "";
    let itemAmount = providedAmount || 1;
    if (!itemName) {
      if (Array.isArray(rawInventory)) {
        for (const item of rawInventory) {
          if (item && (item.slot ?? 0) === slot) {
            itemName = item.name;
            itemAmount = item.amount || 1;
            break;
          }
        }
      } else if (rawInventory[String(slot)]) {
        itemName = rawInventory[String(slot)].name;
        itemAmount = rawInventory[String(slot)].amount || 1;
      }
    }

    // === 1. Try real-time removal via FiveM resource (if player is online) ===
    let liveRemoved = false;
    if (itemName) {
      try {
        const fivemRes = await fetch(`${FIVEM_URL}/dashboard-bridge/removeitem`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citizenid, itemName, slot, amount: itemAmount }),
          signal: AbortSignal.timeout(3000),
        });
        const fivemData = await fivemRes.json();
        if (fivemData.success) {
          liveRemoved = true;
          // If live removed, QBCore will auto-save the updated inventory to DB
          // No need to manually update DB
          return NextResponse.json({ success: true, live: true });
        }
      } catch {
        // FiveM resource not reachable or player offline — fall through to DB-only
      }
    }

    // === 2. Fallback: Remove from database directly (offline player) ===
    if (Array.isArray(rawInventory)) {
      rawInventory = rawInventory.map((item: any, idx: number) => {
        const itemSlot = item?.slot ?? idx + 1;
        return itemSlot === slot ? null : item;
      });
    } else {
      delete rawInventory[String(slot)];
    }

    const updatedJson = JSON.stringify(rawInventory);
    await prisma.$queryRawUnsafe(
      `UPDATE players SET inventory = ? WHERE citizenid = ?`,
      updatedJson, citizenid
    );

    return NextResponse.json({ success: true, live: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

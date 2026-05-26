import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Scan all inventories for duplicate serial numbers
export async function GET() {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT citizenid, name, inventory, charinfo FROM players WHERE inventory IS NOT NULL AND inventory != ''`
    );

    // Map: serialNumber -> [{ citizenid, playerName, charName, itemName, itemLabel, slot }]
    const serialMap: Record<string, any[]> = {};

    for (const row of rows) {
      let inventory: any = {};
      let charinfo: any = {};
      try { inventory = row.inventory ? JSON.parse(row.inventory) : {}; } catch { continue; }
      try { charinfo = row.charinfo ? JSON.parse(row.charinfo) : {}; } catch {}

      const charName = charinfo.firstname && charinfo.lastname
        ? `${charinfo.firstname} ${charinfo.lastname}`
        : row.name;

      // Handle both array and object inventory formats
      const items: any[] = [];
      if (Array.isArray(inventory)) {
        items.push(...inventory.filter(Boolean));
      } else if (typeof inventory === "object") {
        for (const [slot, item] of Object.entries(inventory)) {
          if (item) items.push({ ...(item as any), slot: parseInt(slot) });
        }
      }

      for (const item of items) {
        // Check multiple possible serial number fields
        const serial =
          item.info?.serie ||
          item.info?.serial ||
          item.info?.serialnumber ||
          item.info?.SerialNumber ||
          null;

        if (!serial) continue;

        const key = String(serial);
        if (!serialMap[key]) serialMap[key] = [];
        serialMap[key].push({
          citizenid: row.citizenid,
          playerName: row.name,
          charName,
          itemName: item.name,
          itemLabel: item.label || item.name,
          slot: item.slot,
          amount: item.amount || 1,
        });
      }
    }

    // Filter to only duplicates (serial appears in 2+ players or 2+ times)
    const duplicates: any[] = [];
    for (const [serial, entries] of Object.entries(serialMap)) {
      if (entries.length >= 2) {
        // Check if it's actually different players (not same player different slots)
        const uniquePlayers = new Set(entries.map((e) => e.citizenid));
        duplicates.push({
          serial,
          itemName: entries[0].itemLabel || entries[0].itemName,
          count: entries.length,
          uniquePlayerCount: uniquePlayers.size,
          entries,
        });
      }
    }

    // Sort: cross-player dupes first, then by count
    duplicates.sort((a, b) => {
      if (a.uniquePlayerCount > 1 && b.uniquePlayerCount <= 1) return -1;
      if (a.uniquePlayerCount <= 1 && b.uniquePlayerCount > 1) return 1;
      return b.count - a.count;
    });

    return NextResponse.json({ duplicates, totalScanned: rows.length });
  } catch (e: any) {
    console.error("Duplicate scan error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

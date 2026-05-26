import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const license = req.nextUrl.searchParams.get("license");
  const name = req.nextUrl.searchParams.get("name");

  if (!license && !name) return NextResponse.json({ error: "Missing identifier" }, { status: 400 });

  try {
    let rows: any[] = [];

    if (license) {
      const licenseClean = license.replace(/^license:/i, "");
      const licenseFull = `license:${licenseClean}`;

      rows = await prisma.$queryRawUnsafe(
        `SELECT citizenid, name, license, charinfo, job, gang, money, metadata
         FROM players WHERE license = ? OR license = ? ORDER BY last_updated DESC LIMIT 1`,
        licenseClean, licenseFull
      );
    }

    if (!rows.length && name) {
      rows = await prisma.$queryRawUnsafe(
        `SELECT citizenid, name, license, charinfo, job, gang, money, metadata
         FROM players WHERE name = ? ORDER BY last_updated DESC LIMIT 1`,
        name
      );
    }

    if (!rows.length) return NextResponse.json({ player: null });

    const row = rows[0];

    const parse = (val: any) => {
      if (!val) return {};
      if (typeof val === "object") return val;
      try { return JSON.parse(val); } catch { return {}; }
    };

    const charinfo = parse(row.charinfo);
    const job = parse(row.job);
    const gang = parse(row.gang);
    const money = parse(row.money);
    const metadata = parse(row.metadata);

    return NextResponse.json({
      player: {
        citizenid: row.citizenid,
        license: row.license || "",
        name: row.name,
        firstname: charinfo.firstname || "",
        lastname: charinfo.lastname || "",
        charinfo,
        job,
        gang,
        money,
        metadata,
        phone: charinfo.phone || "",
        birthdate: charinfo.birthdate || "",
        nationality: charinfo.nationality || "",
        gender: charinfo.gender,
        fingerprint: metadata.fingerprint || "",
        bloodtype: metadata.bloodtype || "",
        callsign: metadata.callsign || "",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

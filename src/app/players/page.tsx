import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPlayers } from "@/lib/prisma";
import PlayersClient from "./PlayersClient";

export default async function PlayersPage() {
  const session = await auth();
  if (!(session as any)?.staff) redirect("/login");

  let players: any[] = [];
  try {
    const raw = await getPlayers(200);
    players = raw.map((p: any) => {
      let charinfo = null, money = null, job = null;
      try { charinfo = p.charinfo ? JSON.parse(p.charinfo) : null; } catch {}
      try { money = p.money ? JSON.parse(p.money) : null; } catch {}
      try { job = p.job ? JSON.parse(p.job) : null; } catch {}
      return { id: p.id, citizenid: p.citizenid, name: p.name, license: p.license, charinfo, money, job, phone_number: p.phone_number };
    });
  } catch (e) {
    console.error("Error fetching players:", e);
  }

  return <PlayersClient players={players} staff={(session as any).staff} />;
}

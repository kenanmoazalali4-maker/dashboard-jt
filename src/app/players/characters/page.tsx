import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPlayers } from "@/lib/prisma";
import CharactersClient from "./CharactersClient";

export default async function CharactersPage() {
  const session = await auth();
  if (!(session as any)?.staff) redirect("/login");

  let characters: any[] = [];
  try {
    const raw = await getPlayers(0);
    characters = raw.map((p: any) => {
      let charinfo = null, money = null, job = null, gang = null;
      try { charinfo = p.charinfo ? JSON.parse(p.charinfo) : null; } catch {}
      try { money = p.money ? JSON.parse(p.money) : null; } catch {}
      try { job = p.job ? JSON.parse(p.job) : null; } catch {}
      try { gang = p.gang ? JSON.parse(p.gang) : null; } catch {}
      return { id: p.id, citizenid: p.citizenid, name: p.name, license: p.license, charinfo, money, job, gang };
    });
  } catch (e) {
    console.error("Error fetching characters:", e);
  }

  return <CharactersClient characters={characters} staff={(session as any).staff} />;
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBans } from "@/lib/prisma";
import BansClient from "./BansClient";

export default async function BansPage() {
  const session = await auth();
  if (!(session as any)?.staff) redirect("/login");

  let bans: any[] = [];
  try {
    const raw = await getBans();
    const now = Math.floor(Date.now() / 1000);
    bans = raw.map((b: any) => ({
      id: b.id, name: b.name, license: b.license, discord: b.discord, ip: b.ip,
      reason: b.reason,
      expire: b.expire,
      bannedby: b.bannedby,
      // permanent if expire is very large or null
      permanent: !b.expire || b.expire >= 2147483640,
    }));
  } catch (e) {
    console.error("Error fetching bans:", e);
  }

  return <BansClient bans={bans} staff={(session as any).staff} />;
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import StaffClient from "./StaffClient";

export default async function StaffPage() {
  const session = await auth();
  if (!(session as any)?.staff) redirect("/login");

  let staffMembers: any[] = [];
  try {
    const raw = await prisma.dashboardStaff.findMany({ orderBy: { createdAt: "desc" } });
    staffMembers = raw.map((s) => ({
      id: s.id,
      discordId: s.discordId,
      username: s.username,
      avatar: s.avatar,
      permissions: s.permissions ? JSON.parse(s.permissions) : [],
      createdAt: s.createdAt.toISOString(),
    }));
  } catch (e) {
    console.error("Error fetching staff:", e);
  }

  return <StaffClient staffMembers={staffMembers} currentStaff={(session as any).staff} />;
}

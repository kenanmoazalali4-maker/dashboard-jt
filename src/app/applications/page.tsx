import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ApplicationsClient from "./ApplicationsClient";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!(session as any)?.staff) redirect("/login");

  let applications: any[] = [];
  try {
    const raw = await prisma.dashboardApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: { reviewer: true },
    });
    applications = raw.map((a) => ({
      id: a.id,
      applicantName: a.applicantName,
      applicantDiscord: a.applicantDiscord,
      applicantAge: a.applicantAge,
      answers: a.answers ? JSON.parse(a.answers) : {},
      status: a.status,
      reviewerNotes: a.reviewerNotes,
      reviewerName: a.reviewer?.username || null,
      createdAt: a.createdAt.toISOString(),
    }));
  } catch (e) {
    console.error("Error fetching applications:", e);
  }

  return <ApplicationsClient applications={applications} staff={(session as any).staff} />;
}

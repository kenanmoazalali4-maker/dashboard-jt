import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Public POST - anyone can submit an application
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicantName, applicantDiscord, applicantAge, answers } = body;

    if (!applicantName) return NextResponse.json({ error: "Name required" }, { status: 400 });

    await prisma.dashboardApplication.create({
      data: {
        applicantName,
        applicantDiscord: applicantDiscord || null,
        applicantAge: applicantAge || null,
        answers: answers ? JSON.stringify(answers) : null,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Staff PATCH - review application
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const staff = (session as any)?.staff;
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, reviewerNotes } = body;

    await prisma.dashboardApplication.update({
      where: { id },
      data: {
        status,
        reviewerId: staff.id,
        reviewerNotes: reviewerNotes || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

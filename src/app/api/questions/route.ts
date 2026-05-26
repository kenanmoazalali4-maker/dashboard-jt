import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

const SETTINGS_KEY = "application_questions";

const DEFAULT_CONFIG = {
  fields: [
    { id: "name", label: "الاسم", type: "text", placeholder: "اسمك", required: true, enabled: true, fixed: true },
    { id: "discord", label: "معرف Discord", type: "text", placeholder: "مثال: username#1234 أو ID", required: false, enabled: true, fixed: true },
    { id: "age", label: "العمر", type: "number", placeholder: "عمرك", required: false, enabled: true, fixed: true },
  ],
  questions: [
    "ما هو اسمك الحقيقي؟",
    "كم عمرك؟",
    "لماذا تريد الانضمام للسيرفر؟",
    "هل لديك خبرة سابقة في سيرفرات FiveM؟",
    "كم ساعة تستطيع اللعب يومياً؟",
    "هل قرأت قوانين السيرفر؟",
  ],
};

// Get config (public)
export async function GET() {
  try {
    const setting = await prisma.dashboardSettings.findUnique({
      where: { keyName: SETTINGS_KEY },
    });
    if (setting) {
      const config = JSON.parse(setting.value);
      // Ensure backward compatibility
      if (Array.isArray(config)) {
        return NextResponse.json({ fields: DEFAULT_CONFIG.fields, questions: config });
      }
      return NextResponse.json({
        fields: config.fields || DEFAULT_CONFIG.fields,
        questions: config.questions || DEFAULT_CONFIG.questions,
      });
    }
    return NextResponse.json(DEFAULT_CONFIG);
  } catch {
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

// Save config (admin only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { fields, questions } = await req.json();
    const cleanedQuestions = (questions || []).filter((q: string) => q.trim() !== "");
    const config = { fields: fields || DEFAULT_CONFIG.fields, questions: cleanedQuestions };

    await prisma.dashboardSettings.upsert({
      where: { keyName: SETTINGS_KEY },
      update: { value: JSON.stringify(config) },
      create: { keyName: SETTINGS_KEY, value: JSON.stringify(config) },
    });

    return NextResponse.json({ success: true, ...config });
  } catch (e: any) {
    console.error("Save questions error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

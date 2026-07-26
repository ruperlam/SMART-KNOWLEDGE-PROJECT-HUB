import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Returns learned keyword -> topic rules so the client can suggest a topic
// before the user confirms (Preference Learning, per spec section 5.4).
export async function GET() {
  const rules = await prisma.userPreferenceRule.findMany({
    orderBy: { confidence: "desc" },
  });
  return NextResponse.json(rules);
}

// Upserts a keyword -> topic rule. Called every time the user confirms a
// topic for an ingested item, so future items with a similar title/keyword
// get the topic pre-selected automatically.
export async function POST(req: NextRequest) {
  const { keyword, topicId } = await req.json();
  if (!keyword || !topicId) {
    return NextResponse.json(
      { error: "keyword and topicId are required" },
      { status: 400 }
    );
  }
  const normalized = String(keyword).toLowerCase().trim();
  const rule = await prisma.userPreferenceRule.upsert({
    where: { keyword: normalized },
    update: { preferredTopicId: topicId, confidence: { increment: 0.05 } },
    create: { keyword: normalized, preferredTopicId: topicId },
  });
  return NextResponse.json(rule, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MODEL = "gemini-2.5-flash-preview-09-2025";

type GeminiResult = {
  refinedTitle: string;
  summary: string;
  actionSteps: string[];
  suggestedTopic: string;
  suggestedKeywords: string[];
};

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Ngôn ngữ": ["ielts", "hsk", "topik", "từ vựng", "ngữ pháp", "english", "tiếng"],
  Notion: ["notion", "template", "second brain", "workspace"],
  Financial: ["cfa", "cma", "tài chính", "đầu tư", "excel", "budget", "finance"],
  AI: ["gemini", "ai", "llm", "prompt", "rag", "chatgpt"],
  "In 3D": ["in 3d", "3d print", "slicer", "cad", "stl"],
  "Dinh dưỡng & Thể chất": ["ăn", "eat clean", "workout", "gym", "dinh dưỡng", "giảm cân"],
  Decor: ["decor", "nội thất", "phối màu", "trang trí"],
  "Multimedia Production": ["premiere", "dựng phim", "video edit", "capcut", "after effects"],
  "Mỹ Phẩm": ["kem", "mỹ phẩm", "skincare", "chống nắng"],
};

function mockEnhance(rawInput: string): GeminiResult {
  const lower = rawInput.toLowerCase();
  let suggestedTopic = "AI";
  for (const [topic, kws] of Object.entries(TOPIC_KEYWORDS)) {
    if (kws.some((kw) => lower.includes(kw))) {
      suggestedTopic = topic;
      break;
    }
  }

  const cleanTitle =
    rawInput.length > 60 ? rawInput.slice(0, 57).trimEnd() + "..." : rawInput;

  return {
    refinedTitle: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
    summary: `Ý tưởng này tập trung vào "${rawInput.slice(0, 80)}". Gemini đề xuất tách nhỏ thành các bước hành động cụ thể để đưa vào Topic "${suggestedTopic}".`,
    actionSteps: [
      "Xem lại nội dung gốc và ghi chú các điểm chính",
      "Xác định mục tiêu áp dụng cụ thể trong 1 tuần tới",
      "Tạo hoặc cập nhật Project liên quan trong Smartech Hub",
    ],
    suggestedTopic,
    suggestedKeywords: lower
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 4),
  };
}

async function applyPreferenceLearning(keywords: string[], topicName: string) {
  const topic = await prisma.topic.findUnique({ where: { name: topicName } });
  if (!topic || keywords.length === 0) return;
  const primary = keywords[0];
  try {
    await prisma.userPreferenceRule.upsert({
      where: { keyword: primary },
      update: { preferredTopicId: topic.id, confidence: { increment: 0.05 } },
      create: { keyword: primary, preferredTopicId: topic.id, confidence: 1.0 },
    });
  } catch {
    // best-effort, don't block the response
  }
}

export async function POST(req: NextRequest) {
  const { rawInput } = await req.json();

  if (!rawInput || typeof rawInput !== "string") {
    return NextResponse.json({ error: "rawInput is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let result: GeminiResult;

  if (apiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are the AI Co-Pilot for a Personal Knowledge Management app. Given this raw idea, return strict JSON with keys refinedTitle, summary, actionSteps (array of 3-5 strings), suggestedTopic (one of: ${Object.keys(
                      TOPIC_KEYWORDS
                    ).join(", ")}), suggestedKeywords (array of 3-5 lowercase strings). Raw idea: """${rawInput}"""`,
                  },
                ],
              },
            ],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      result = text ? JSON.parse(text) : mockEnhance(rawInput);
    } catch {
      result = mockEnhance(rawInput);
    }
  } else {
    result = mockEnhance(rawInput);
  }

  await applyPreferenceLearning(result.suggestedKeywords, result.suggestedTopic);

  return NextResponse.json(result);
}

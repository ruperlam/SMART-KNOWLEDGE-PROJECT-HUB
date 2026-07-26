import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SourceType =
  | "TIKTOK"
  | "FACEBOOK_REELS"
  | "THREADS"
  | "YOUTUBE"
  | "PDF"
  | "EXCEL"
  | "WORD"
  | "OTHER";

const TOPICS = [
  "Ngôn ngữ",
  "Notion",
  "Financial",
  "AI",
  "In 3D",
  "Dinh dưỡng & Thể chất",
  "Decor",
  "Multimedia Production",
  "Mỹ Phẩm",
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Seeding topics...");
  const topics: Record<string, string> = {};
  for (const name of TOPICS) {
    const topic = await prisma.topic.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    topics[name] = topic.id;
  }

  console.log("Seeding channels...");
  const channelDefs: { name: string; sourceType: SourceType }[] = [
    { name: "TikTok @hoc.tieng.trung", sourceType: "TIKTOK" },
    { name: "Facebook Reels — Decor Ideas", sourceType: "FACEBOOK_REELS" },
    { name: "Threads @ai.daily", sourceType: "THREADS" },
    { name: "YouTube — Notion Masters", sourceType: "YOUTUBE" },
    { name: "PDF Library", sourceType: "PDF" },
    { name: "Excel Templates", sourceType: "EXCEL" },
    { name: "Word Docs", sourceType: "WORD" },
  ];
  const channels: Record<string, string> = {};
  for (const c of channelDefs) {
    const existing = await prisma.channel.findFirst({ where: { name: c.name } });
    const channel =
      existing ??
      (await prisma.channel.create({ data: c }));
    channels[c.name] = channel.id;
  }

  const existingItemCount = await prisma.item.count();
  if (existingItemCount > 0) {
    console.log(
      `Đã có ${existingItemCount} item trong database — bỏ qua seed dữ liệu mẫu (topics/channels vẫn được đảm bảo tồn tại ở trên).`
    );
    return;
  }

  console.log("Seeding project...");
  const project = await prisma.project.create({
    data: {
      title: "IELTS 7.0 trong 90 ngày",
      description: "Lộ trình luyện thi IELTS tổng hợp từ các video và tài liệu đã lưu.",
      steps: JSON.stringify([
        "Đánh giá trình độ hiện tại (mock test)",
        "Luyện từ vựng theo chủ đề — 20 từ/ngày",
        "Luyện Writing Task 2 — 3 bài/tuần",
        "Luyện Speaking với AI Co-Pilot",
      ]),
      progress: 35,
      topicId: topics["Ngôn ngữ"],
    },
  });

  console.log("Seeding items...");
  const items: {
    title: string;
    sourceType: SourceType;
    channel: string;
    topic: string;
    fileSizeMb: number;
    status: "UNREAD" | "IN_PROGRESS" | "READ" | "ARCHIVED";
    addedAt: Date;
    slaDays: number;
    projectId?: string;
    thumbnailUrl?: string;
  }[] = [
    {
      title: "5 mẹo học từ vựng HSK4 nhanh nhớ lâu",
      sourceType: "TIKTOK",
      channel: "TikTok @hoc.tieng.trung",
      topic: "Ngôn ngữ",
      fileSizeMb: 18.4,
      status: "UNREAD",
      addedAt: daysAgo(9),
      slaDays: 7,
    },
    {
      title: "IELTS Writing Task 2 — Band 8 sample analysis",
      sourceType: "YOUTUBE",
      channel: "YouTube — Notion Masters",
      topic: "Ngôn ngữ",
      fileSizeMb: 45.2,
      status: "IN_PROGRESS",
      addedAt: daysAgo(6),
      slaDays: 7,
      projectId: project.id,
    },
    {
      title: "Notion Second Brain Template 2026",
      sourceType: "YOUTUBE",
      channel: "YouTube — Notion Masters",
      topic: "Notion",
      fileSizeMb: 62.1,
      status: "UNREAD",
      addedAt: daysAgo(1),
      slaDays: 7,
    },
    {
      title: "CFA Level 1 — Ethics Cheat Sheet.pdf",
      sourceType: "PDF",
      channel: "PDF Library",
      topic: "Financial",
      fileSizeMb: 142.7,
      status: "UNREAD",
      addedAt: daysAgo(4),
      slaDays: 5,
    },
    {
      title: "Gemini 2.5 Flash — thực chiến RAG pipeline",
      sourceType: "THREADS",
      channel: "Threads @ai.daily",
      topic: "AI",
      fileSizeMb: 3.1,
      status: "READ",
      addedAt: daysAgo(12),
      slaDays: 7,
      readAt: undefined,
    } as any,
    {
      title: "In 3D mô hình vòi sen mini — hướng dẫn slicer",
      sourceType: "YOUTUBE",
      channel: "YouTube — Notion Masters",
      topic: "In 3D",
      fileSizeMb: 88.5,
      status: "UNREAD",
      addedAt: daysAgo(2),
      slaDays: 10,
    },
    {
      title: "Thực đơn eat-clean 7 ngày giảm mỡ bụng",
      sourceType: "FACEBOOK_REELS",
      channel: "Facebook Reels — Decor Ideas",
      topic: "Dinh dưỡng & Thể chất",
      fileSizeMb: 24.0,
      status: "UNREAD",
      addedAt: daysAgo(8),
      slaDays: 7,
    },
    {
      title: "Phối màu Muted Plum cho phòng khách nhỏ",
      sourceType: "FACEBOOK_REELS",
      channel: "Facebook Reels — Decor Ideas",
      topic: "Decor",
      fileSizeMb: 31.6,
      status: "UNREAD",
      addedAt: daysAgo(0),
      slaDays: 7,
    },
    {
      title: "Dựng phim ngắn bằng Premiere — Workflow YouTube Short",
      sourceType: "YOUTUBE",
      channel: "YouTube — Notion Masters",
      topic: "Multimedia Production",
      fileSizeMb: 176.3,
      status: "IN_PROGRESS",
      addedAt: daysAgo(3),
      slaDays: 7,
    },
    {
      title: "Review kem chống nắng thuần chay 2026",
      sourceType: "TIKTOK",
      channel: "TikTok @hoc.tieng.trung",
      topic: "Mỹ Phẩm",
      fileSizeMb: 15.9,
      status: "UNREAD",
      addedAt: daysAgo(5),
      slaDays: 7,
    },
    {
      title: "Excel Dashboard Template — Personal Finance Tracker",
      sourceType: "EXCEL",
      channel: "Excel Templates",
      topic: "Financial",
      fileSizeMb: 4.4,
      status: "UNREAD",
      addedAt: daysAgo(1),
      slaDays: 7,
    },
    {
      title: "Bảng động từ bất quy tắc TOPIK II",
      sourceType: "WORD",
      channel: "Word Docs",
      topic: "Ngôn ngữ",
      fileSizeMb: 1.2,
      status: "UNREAD",
      addedAt: daysAgo(15),
      slaDays: 7,
    },
  ];

  for (const it of items) {
    await prisma.item.create({
      data: {
        title: it.title,
        sourceType: it.sourceType,
        channelId: channels[it.channel],
        topicId: topics[it.topic],
        fileSizeMb: it.fileSizeMb,
        status: it.status,
        addedAt: it.addedAt,
        slaDays: it.slaDays,
        projectId: it.projectId,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

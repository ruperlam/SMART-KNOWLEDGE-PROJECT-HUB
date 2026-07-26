import { prisma } from "@/lib/prisma";
import BentoCard, { BentoItem } from "@/components/BentoCard";
import AutoIngestBar from "@/components/AutoIngestBar";
import IdeaBar from "@/components/IdeaBar";
import SearchBar from "@/components/SearchBar";
import FilterTabs from "@/components/FilterTabs";
import StatsRow from "@/components/StatsRow";
import ManualAddModal from "@/components/ManualAddModal";
import DriveStatusBanner from "@/components/DriveStatusBanner";
import { getSlaBadge } from "@/lib/sla";
import { isDriveConnected, isGoogleConfigured } from "@/lib/googleDrive";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: {
    topic?: string;
    status?: string;
    q?: string;
    drive_connected?: string;
    drive_error?: string;
  };
}) {
  const topicId = searchParams.topic;
  const status = searchParams.status;
  const q = searchParams.q?.trim();

  // Defense in depth: lib/prisma.ts already retries queries that fail due to
  // Neon's compute waking up from auto-suspend, but if that ever still loses
  // the race, fall back to a friendly empty state instead of crashing the
  // whole page render (which Render's proxy surfaces as a 502).
  let allTopicItems: BentoItem[] = [];
  let topics: { id: string; name: string }[] = [];
  let projects: { id: string; title: string; topicId: string }[] = [];
  let activeTopic: { id: string; name: string } | null = null;
  let driveConnected = false;
  let loadError = false;

  try {
    [allTopicItems, topics, projects, activeTopic, driveConnected] = await Promise.all([
      // Full item set for this topic (unfiltered by status/q) — used to compute
      // stable stat-card counts regardless of the active filter/search.
      prisma.item.findMany({
        where: topicId ? { topicId } : undefined,
        include: { channel: true, topic: true },
        orderBy: { addedAt: "desc" },
      }) as Promise<BentoItem[]>,
      prisma.topic.findMany({ orderBy: { name: "asc" } }),
      prisma.project.findMany({ select: { id: true, title: true, topicId: true } }),
      topicId ? prisma.topic.findUnique({ where: { id: topicId } }) : null,
      isDriveConnected(),
    ]);
  } catch {
    loadError = true;
  }

  const items = (allTopicItems as BentoItem[]).filter((item) => {
    if (status && item.status !== status) return false;
    if (q) {
      const haystack = `${item.title} ${item.notes ?? ""} ${item.channel.name} ${item.topic.name}`.toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const total = allTopicItems.length;
  const unread = (allTopicItems as BentoItem[]).filter((i) => i.status === "UNREAD").length;
  const completed = (allTopicItems as BentoItem[]).filter((i) => i.status === "READ").length;
  const overdue = (allTopicItems as BentoItem[]).filter(
    (i) => i.status !== "READ" && getSlaBadge(new Date(i.addedAt), i.slaDays, i.status).level === "red"
  ).length;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-5">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-accent-cream">
          {activeTopic ? activeTopic.name : "Dashboard"}
        </h1>
      </header>

      {loadError && (
        <div className="bento-card p-4 text-sm text-accent-rose border border-accent-rose/40">
          Database vừa "thức dậy" sau một lúc không hoạt động, có thể mất vài giây.{" "}
          <a href="?" className="underline font-medium">
            Tải lại trang
          </a>
          .
        </div>
      )}

      <DriveStatusBanner
        connected={driveConnected}
        configured={isGoogleConfigured()}
        justConnected={searchParams.drive_connected === "1"}
        error={searchParams.drive_error}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar />
        <ManualAddModal topics={topics} projects={projects} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <AutoIngestBar topics={topics} projects={projects} />
        <IdeaBar topics={topics} projects={projects} />
      </div>

      <StatsRow total={total} unread={unread} overdue={overdue} completed={completed} />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2">
        <div>
          <h2 className="font-heading text-lg font-semibold text-accent-cream">
            Kho Tri Thức &amp; Media (Bento View)
          </h2>
          <p className="text-xs text-accent-mauve mt-1">
            Tự động đánh giá SLA aging: 🟢 Mới thêm | 🟡 Sắp quá hạn | 🔴 Quá hạn
          </p>
        </div>
        <FilterTabs />
      </div>

      {items.length === 0 ? (
        <div className="bento-card p-10 text-center text-accent-mauve">
          {q || status
            ? "Không tìm thấy tài liệu phù hợp."
            : (
              <>
                Chưa có item nào. Dán một link ở trên hoặc chạy{" "}
                <code className="text-accent-blush">npm run prisma:seed</code>.
              </>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <BentoCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

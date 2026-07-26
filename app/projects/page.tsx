import { prisma } from "@/lib/prisma";
import { FolderKanban } from "lucide-react";

export const dynamic = "force-dynamic";

type ProjectWithRelations = {
  id: string;
  title: string;
  description: string | null;
  steps: string;
  progress: number;
  topic: { name: string };
  items: unknown[];
};

export default async function ProjectsPage() {
  const projects = (await prisma.project.findMany({
    include: { topic: true, items: true },
    orderBy: { createdAt: "desc" },
  })) as ProjectWithRelations[];

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-accent-cream">
          Projects
        </h1>
        <p className="text-accent-blush text-sm mt-1">
          {projects.length} project incubator{projects.length !== 1 ? "s" : ""}
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="bento-card p-10 text-center text-accent-mauve">
          Chưa có project nào. Chạy{" "}
          <code className="text-accent-blush">npm run prisma:seed</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map((p) => {
            const steps: string[] = JSON.parse(p.steps || "[]");
            return (
              <div key={p.id} className="bento-card p-6">
                <div className="flex items-center gap-2 mb-2">
                  <FolderKanban size={18} className="text-accent-blush" />
                  <h3 className="font-heading font-semibold text-accent-cream">
                    {p.title}
                  </h3>
                </div>
                <p className="text-xs text-accent-mauve mb-3">{p.topic.name}</p>
                {p.description && (
                  <p className="text-sm text-accent-blush mb-4">
                    {p.description}
                  </p>
                )}

                <div className="w-full bg-card-bg rounded-full h-2 mb-4 overflow-hidden">
                  <div
                    className="bg-accent-blush h-2 rounded-full transition-all"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <p className="text-xs text-accent-mauve mb-4">
                  {p.progress}% hoàn thành · {p.items.length} tài liệu tham khảo
                </p>

                <ol className="space-y-1.5">
                  {steps.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-accent-cream flex gap-2 bg-card-bg/60 rounded-xl px-3 py-2 border border-accent-mauve/20"
                    >
                      <span className="text-accent-blush font-semibold">
                        {i + 1}.
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

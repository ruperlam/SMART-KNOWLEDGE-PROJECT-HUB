"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  Languages,
  NotebookText,
  LineChart,
  BrainCircuit,
  Box,
  HeartPulse,
  Sofa,
  Clapperboard,
  Sparkles,
  FolderKanban,
  Menu,
} from "lucide-react";
import { useState } from "react";

const TOPIC_ICONS: Record<string, React.ElementType> = {
  "Ngôn ngữ": Languages,
  Notion: NotebookText,
  Financial: LineChart,
  AI: BrainCircuit,
  "In 3D": Box,
  "Dinh dưỡng & Thể chất": HeartPulse,
  Decor: Sofa,
  "Multimedia Production": Clapperboard,
  "Mỹ Phẩm": Sparkles,
};

type Topic = { id: string; name: string; _count: { items: number } };

export default function Sidebar({ topics }: { topics: Topic[] }) {
  const searchParams = useSearchParams();
  const activeTopic = searchParams.get("topic");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? "w-[76px]" : "w-64"
      } shrink-0 h-screen sticky top-0 bg-bg-surface/90 backdrop-blur-md border-r border-accent-mauve/20 flex flex-col transition-all duration-200`}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-accent-mauve/20">
        {!collapsed && (
          <span className="font-heading font-semibold text-accent-cream text-lg tracking-tight">
            Smartech Hub
          </span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-accent-blush hover:text-accent-cream p-1.5 rounded-lg hover:bg-card-bg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            !activeTopic
              ? "bg-card-bg text-accent-cream"
              : "text-accent-blush hover:bg-card-bg/60 hover:text-accent-cream"
          }`}
        >
          <LayoutGrid size={18} />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        <Link
          href="/projects"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent-blush hover:bg-card-bg/60 hover:text-accent-cream transition-colors"
        >
          <FolderKanban size={18} />
          {!collapsed && <span>Projects</span>}
        </Link>

        {!collapsed && (
          <div className="pt-4 pb-1 px-3 text-[11px] uppercase tracking-wider text-accent-mauve font-semibold">
            Topics
          </div>
        )}

        {topics.length === 0 && !collapsed && (
          <p className="px-3 text-xs text-accent-mauve">
            Chưa có topic — chạy prisma seed.
          </p>
        )}

        {topics.map((topic) => {
          const Icon = TOPIC_ICONS[topic.name] ?? LayoutGrid;
          const isActive = activeTopic === topic.id;
          return (
            <Link
              key={topic.id}
              href={`/?topic=${topic.id}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-card-bg text-accent-cream"
                  : "text-accent-blush hover:bg-card-bg/60 hover:text-accent-cream"
              }`}
              title={topic.name}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{topic.name}</span>
              )}
              {!collapsed && topic._count.items > 0 && (
                <span className="text-[11px] bg-accent-mauve/30 text-accent-cream rounded-full px-2 py-0.5">
                  {topic._count.items}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-accent-mauve/20 text-[11px] text-accent-mauve">
          Smartech Hub · Local Demo
        </div>
      )}
    </aside>
  );
}

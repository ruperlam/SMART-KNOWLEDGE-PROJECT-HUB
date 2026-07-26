"use client";

import { useState } from "react";
import {
  Music2,
  Video,
  MessageCircle,
  Youtube,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getSlaBadge, badgeClasses } from "@/lib/sla";
import PDFViewerModal from "./PDFViewerModal";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  TIKTOK: Music2,
  FACEBOOK_REELS: Video,
  THREADS: MessageCircle,
  YOUTUBE: Youtube,
  PDF: FileText,
  EXCEL: FileSpreadsheet,
  WORD: File,
  OTHER: File,
};

export type BentoItem = {
  id: string;
  title: string;
  sourceType: string;
  storagePath: string | null;
  notes: string | null;
  fileSizeMb: number | null;
  status: "UNREAD" | "IN_PROGRESS" | "READ" | "ARCHIVED";
  addedAt: string | Date;
  slaDays: number;
  channel: { name: string };
  topic: { name: string };
};

export default function BentoCard({ item }: { item: BentoItem }) {
  const [open, setOpen] = useState(false);
  const Icon = SOURCE_ICONS[item.sourceType] ?? File;
  const badge = getSlaBadge(new Date(item.addedAt), item.slaDays, item.status);

  return (
    <>
      <div className="bento-card p-5 flex flex-col gap-3 cursor-pointer group">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-accent-mauve/20 text-accent-blush shrink-0">
            <Icon size={18} />
          </span>
          <span className={`sla-badge ${badgeClasses[badge.level]}`}>
            {badge.emoji} {badge.label}
          </span>
        </div>

        <div onClick={() => setOpen(true)} className="flex-1">
          <h3 className="font-heading font-semibold text-accent-cream text-[15px] leading-snug line-clamp-2 group-hover:text-accent-blush transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-accent-mauve mt-1.5 truncate">
            {item.channel.name} · {item.topic.name}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-accent-blush/70 pt-2 border-t border-accent-mauve/20">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {badge.ageDays} ngày trước
          </span>
          <span>
            {item.fileSizeMb ? `${item.fileSizeMb.toFixed(1)} MB` : "—"}
          </span>
          {item.status === "READ" && (
            <span className="inline-flex items-center gap-1 text-status-green">
              <CheckCircle2 size={12} /> Đã đọc
            </span>
          )}
        </div>
      </div>

      {open && (
        <PDFViewerModal
          title={item.title}
          sourceType={item.sourceType}
          storagePath={item.storagePath}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

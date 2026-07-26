"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Check } from "lucide-react";

type Topic = { id: string; name: string };
type Project = { id: string; title: string; topicId: string };

const SOURCE_TYPES = [
  { value: "PDF", label: "PDF" },
  { value: "EXCEL", label: "Excel" },
  { value: "WORD", label: "Word" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "FACEBOOK_REELS", label: "Facebook Reels" },
  { value: "THREADS", label: "Threads" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "OTHER", label: "Khác" },
];

export default function ManualAddModal({
  topics,
  projects,
}: {
  topics: Topic[];
  projects: Project[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState("PDF");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [storagePath, setStoragePath] = useState("");

  const relatedProjects = projects.filter((p) => p.topicId === topicId);

  async function handleSave() {
    if (!title.trim() || !topicId) return;
    setSaving(true);
    try {
      await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sourceType,
          topicId,
          projectId: projectId || null,
          notes: notes || null,
          storagePath: storagePath || null,
          channelName: "Thêm thủ công",
        }),
      });
      setOpen(false);
      setTitle("");
      setNotes("");
      setStoragePath("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-card-bg border border-accent-mauve/30 text-accent-cream font-semibold text-sm px-4 py-3 rounded-2xl hover:border-accent-blush/50 transition-colors whitespace-nowrap"
      >
        <Plus size={16} />
        Thêm thủ công
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-bg-dark/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-bg-surface rounded-bento border border-accent-mauve/30 shadow-neumorph overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-accent-mauve/20">
              <h2 className="font-heading font-semibold text-accent-cream text-sm">
                Thêm tài liệu thủ công
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-accent-blush hover:text-accent-cream p-1 rounded-lg hover:bg-card-bg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề tài liệu"
                className="w-full bg-card-bg/60 border border-accent-mauve/30 text-accent-cream text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent-blush placeholder:text-accent-mauve"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="bg-card-bg/60 border border-accent-mauve/30 text-accent-cream text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent-blush"
                >
                  {SOURCE_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <select
                  value={topicId}
                  onChange={(e) => {
                    setTopicId(e.target.value);
                    setProjectId("");
                  }}
                  className="bg-card-bg/60 border border-accent-mauve/30 text-accent-cream text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent-blush"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {relatedProjects.length > 0 && (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-card-bg/60 border border-accent-mauve/30 text-accent-cream text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent-blush"
                >
                  <option value="">— Không link Project —</option>
                  {relatedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              )}

              <input
                value={storagePath}
                onChange={(e) => setStoragePath(e.target.value)}
                placeholder="Đường dẫn / URL file (tùy chọn)"
                className="w-full bg-card-bg/60 border border-accent-mauve/30 text-accent-cream text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent-blush placeholder:text-accent-mauve"
              />

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú (tùy chọn)"
                rows={3}
                className="w-full bg-card-bg/60 border border-accent-mauve/30 text-accent-cream text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent-blush placeholder:text-accent-mauve resize-none"
              />
            </div>

            <div className="px-5 py-4 border-t border-accent-mauve/20 flex justify-end">
              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="inline-flex items-center gap-1.5 bg-accent-blush text-bg-dark font-semibold text-sm px-4 py-2 rounded-xl hover:bg-accent-cream transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

type Topic = { id: string; name: string };
type Project = { id: string; title: string; topicId: string };

export default function LinkTopicModal({
  topics,
  projects,
  suggestedTopicName,
  onClose,
  onConfirm,
}: {
  topics: Topic[];
  projects: Project[];
  suggestedTopicName?: string;
  onClose: () => void;
  onConfirm: (topicId: string, projectId: string | null) => void;
}) {
  const suggested = topics.find((t) => t.name === suggestedTopicName);
  const [topicId, setTopicId] = useState<string>(suggested?.id ?? topics[0]?.id ?? "");
  const [projectId, setProjectId] = useState<string>("");

  const relatedProjects = projects.filter((p) => p.topicId === topicId);

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-dark/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-bg-surface rounded-bento border border-accent-mauve/30 shadow-neumorph overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-accent-mauve/20">
          <h2 className="font-heading font-semibold text-accent-cream text-sm">
            Chọn Topic & Project
          </h2>
          <button
            onClick={onClose}
            className="text-accent-blush hover:text-accent-cream p-1 rounded-lg hover:bg-card-bg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-accent-mauve font-semibold block mb-2">
              Topic
            </label>
            <div className="grid grid-cols-2 gap-2">
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTopicId(t.id);
                    setProjectId("");
                  }}
                  className={`text-left text-xs px-3 py-2 rounded-xl border transition-colors ${
                    topicId === t.id
                      ? "bg-accent-blush text-bg-dark border-accent-blush font-semibold"
                      : "bg-card-bg/50 text-accent-blush border-accent-mauve/20 hover:border-accent-blush/50"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {relatedProjects.length > 0 && (
            <div>
              <label className="text-[11px] uppercase tracking-wider text-accent-mauve font-semibold block mb-2">
                Link tới Project (tùy chọn)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-card-bg/60 border border-accent-mauve/30 text-accent-cream text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-accent-blush"
              >
                <option value="">— Không link —</option>
                {relatedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-accent-mauve/20 flex justify-end">
          <button
            onClick={() => onConfirm(topicId, projectId || null)}
            disabled={!topicId}
            className="inline-flex items-center gap-1.5 bg-accent-blush text-bg-dark font-semibold text-sm px-4 py-2 rounded-xl hover:bg-accent-cream transition-colors disabled:opacity-50"
          >
            <Check size={16} />
            Lưu vào Hub
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Download, Loader2 } from "lucide-react";
import LinkTopicModal from "./LinkTopicModal";
import { suggestTopicId, primaryKeyword, PreferenceRule } from "@/lib/preferenceMatch";

type Topic = { id: string; name: string };
type Project = { id: string; title: string; topicId: string };

type IngestMeta = {
  title: string;
  thumbnailUrl: string | null;
  sourceType: string;
  storagePath: string | null;
  fileSizeMb: number;
  note: string;
  tempFile: { tempId: string; fileName: string; ext: string } | null;
};

export default function AutoIngestBar({
  topics,
  projects,
}: {
  topics: Topic[];
  projects: Project[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<IngestMeta | null>(null);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [suggestedTopicName, setSuggestedTopicName] = useState<string | undefined>();

  async function handleIngest() {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const [metaRes, rulesRes] = await Promise.all([
        fetch("/api/ingest/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }),
        fetch("/api/preferences"),
      ]);
      const data: IngestMeta = await metaRes.json();
      const rules: PreferenceRule[] = rulesRes.ok ? await rulesRes.json() : [];

      const suggestedId = suggestTopicId(`${data.title} ${url}`, rules);
      const suggestedTopic = topics.find((t) => t.id === suggestedId);

      setMeta(data);
      setSuggestedTopicName(suggestedTopic?.name);
      setShowTopicPicker(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(topicId: string, projectId: string | null) {
    if (!meta) return;
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: meta.title,
        sourceType: meta.sourceType,
        topicId,
        projectId,
        storagePath: meta.storagePath,
        thumbnailUrl: meta.thumbnailUrl,
        notes: meta.note,
        fileSizeMb: meta.fileSizeMb,
        originalUrl: url,
        channelName: `${meta.sourceType} Auto Ingest`,
        tempFile: meta.tempFile,
      }),
    });

    const kw = primaryKeyword(meta.title);
    if (kw) {
      fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, topicId }),
      }).catch(() => {});
    }

    setShowTopicPicker(false);
    setMeta(null);
    setUrl("");
    router.refresh();
  }

  return (
    <>
      <div className="flex-1 min-w-0">
        <div className="bento-card flex items-center gap-2 p-2 pl-4">
          <Link2 size={18} className="text-accent-mauve shrink-0" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleIngest()}
            placeholder="Dán URL TikTok, Reels, Threads, YouTube hoặc PDF..."
            className="flex-1 bg-transparent text-sm text-accent-cream placeholder:text-accent-mauve focus:outline-none min-w-0"
          />
          <button
            onClick={handleIngest}
            disabled={!url.trim() || loading}
            className="inline-flex items-center gap-1.5 bg-card-bg border border-accent-mauve/30 text-accent-cream font-semibold text-sm px-4 py-2 rounded-xl hover:border-accent-blush/50 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Auto Ingest
          </button>
        </div>
        {loading && (
          <p className="text-[11px] text-accent-mauve mt-1.5 pl-2">
            Đang lấy metadata / tải video (có thể mất một lúc)...
          </p>
        )}
      </div>

      {showTopicPicker && meta && (
        <LinkTopicModal
          topics={topics}
          projects={projects}
          suggestedTopicName={suggestedTopicName}
          onClose={() => setShowTopicPicker(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

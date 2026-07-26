"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lightbulb } from "lucide-react";
import GeminiIdeaModal, { GeminiResult } from "./GeminiIdeaModal";
import LinkTopicModal from "./LinkTopicModal";

type Topic = { id: string; name: string };
type Project = { id: string; title: string; topicId: string };

export default function IdeaBar({
  topics,
  projects,
}: {
  topics: Topic[];
  projects: Project[];
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [step, setStep] = useState<"idle" | "idea" | "topic">("idle");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiResult | null>(null);

  async function handleAnalyze() {
    if (!input.trim()) return;
    setStep("idea");
    setLoading(true);
    try {
      const res = await fetch("/api/gemini/enhance-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: input }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(topicId: string, projectId: string | null) {
    if (!result) return;
    await fetch("/api/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refinedTitle: result.refinedTitle,
        summary: result.summary,
        actionSteps: result.actionSteps,
        suggestedKeywords: result.suggestedKeywords,
        rawInput: input,
        topicId,
        projectId,
      }),
    });
    setStep("idle");
    setInput("");
    setResult(null);
    router.refresh();
  }

  return (
    <>
      <div className="bento-card flex items-center gap-2 p-2 pl-4 flex-1">
        <Lightbulb size={18} className="text-accent-mauve shrink-0" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          placeholder="Nhập ý tưởng thô (ví dụ: 'Học IELTS 7.5 và CFA level 1')..."
          className="flex-1 bg-transparent text-sm text-accent-cream placeholder:text-accent-mauve focus:outline-none min-w-0"
        />
        <button
          onClick={handleAnalyze}
          disabled={!input.trim()}
          className="inline-flex items-center gap-1.5 bg-accent-blush text-bg-dark font-semibold text-sm px-4 py-2 rounded-xl hover:bg-accent-cream transition-colors disabled:opacity-40 whitespace-nowrap"
        >
          <Sparkles size={16} />
          Phân tích với AI
        </button>
      </div>

      {step === "idea" && (
        <GeminiIdeaModal
          loading={loading}
          data={result}
          onClose={() => setStep("idle")}
          onContinue={() => setStep("topic")}
        />
      )}

      {step === "topic" && (
        <LinkTopicModal
          topics={topics}
          projects={projects}
          suggestedTopicName={result?.suggestedTopic}
          onClose={() => setStep("idle")}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

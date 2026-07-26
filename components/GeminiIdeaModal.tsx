"use client";

import { Sparkles, X, Loader2, ArrowRight } from "lucide-react";

export type GeminiResult = {
  refinedTitle: string;
  summary: string;
  actionSteps: string[];
  suggestedTopic: string;
  suggestedKeywords: string[];
};

export default function GeminiIdeaModal({
  loading,
  data,
  onClose,
  onContinue,
}: {
  loading: boolean;
  data: GeminiResult | null;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-bg-dark/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-bg-surface rounded-bento border border-accent-mauve/30 shadow-neumorph overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-accent-mauve/20">
          <h2 className="font-heading font-semibold text-accent-cream text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-accent-blush" />
            Gemini AI Co-Pilot
          </h2>
          <button
            onClick={onClose}
            className="text-accent-blush hover:text-accent-cream p-1 rounded-lg hover:bg-card-bg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 text-accent-blush gap-3">
              <Loader2 className="animate-spin" size={28} />
              <p className="text-sm">Đang phân tích ý tưởng...</p>
            </div>
          )}

          {!loading && data && (
            <>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-accent-mauve font-semibold mb-1">
                  Refined Title
                </p>
                <p className="text-accent-cream font-heading font-semibold">
                  {data.refinedTitle}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-accent-mauve font-semibold mb-1">
                  Summary
                </p>
                <p className="text-accent-blush text-sm leading-relaxed">
                  {data.summary}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-accent-mauve font-semibold mb-2">
                  Action Steps
                </p>
                <ol className="space-y-1.5">
                  {data.actionSteps.map((step, i) => (
                    <li
                      key={i}
                      className="text-sm text-accent-cream flex gap-2 bg-card-bg/60 rounded-xl px-3 py-2 border border-accent-mauve/20"
                    >
                      <span className="text-accent-blush font-semibold">
                        {i + 1}.
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {data.suggestedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-[11px] bg-accent-mauve/20 text-accent-blush rounded-full px-2.5 py-1"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && data && (
          <div className="px-5 py-4 border-t border-accent-mauve/20 flex justify-end">
            <button
              onClick={onContinue}
              className="inline-flex items-center gap-1.5 bg-accent-blush text-bg-dark font-semibold text-sm px-4 py-2 rounded-xl hover:bg-accent-cream transition-colors"
            >
              Chọn Topic & Project
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

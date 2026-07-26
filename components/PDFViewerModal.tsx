"use client";

import { useEffect, useState } from "react";
import { X, FileWarning, Download, FileText, ExternalLink, HardDrive } from "lucide-react";

const VIDEO_TYPES = new Set(["TIKTOK", "FACEBOOK_REELS", "YOUTUBE"]);

export default function PDFViewerModal({
  title,
  sourceType,
  storagePath,
  onClose,
}: {
  title: string;
  sourceType: string;
  storagePath?: string | null;
  onClose: () => void;
}) {
  const isVideo = VIDEO_TYPES.has(sourceType);
  const isDriveLink = !!storagePath?.includes("drive.google.com");
  const isLocalGeneratedDoc =
    sourceType === "WORD" && !!storagePath?.startsWith("/generated/");
  const [mdContent, setMdContent] = useState<string | null>(null);

  useEffect(() => {
    if (isLocalGeneratedDoc && storagePath) {
      fetch(storagePath)
        .then((r) => r.text())
        .then(setMdContent)
        .catch(() => setMdContent(null));
    }
  }, [isLocalGeneratedDoc, storagePath]);

  const docxPath = storagePath?.replace(/\.md$/, ".docx");

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-dark/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-bg-surface rounded-bento border border-accent-mauve/30 shadow-neumorph overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-accent-mauve/20">
          <h2 className="font-heading font-semibold text-accent-cream text-sm truncate pr-4">
            {title}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {isLocalGeneratedDoc && (
              <>
                <a
                  href={storagePath!}
                  download
                  className="inline-flex items-center gap-1.5 text-xs bg-card-bg border border-accent-mauve/30 text-accent-blush px-3 py-1.5 rounded-lg hover:border-accent-blush/50"
                >
                  <FileText size={13} /> .md
                </a>
                <a
                  href={docxPath}
                  download
                  className="inline-flex items-center gap-1.5 text-xs bg-card-bg border border-accent-mauve/30 text-accent-blush px-3 py-1.5 rounded-lg hover:border-accent-blush/50"
                >
                  <Download size={13} /> .docx
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="text-accent-blush hover:text-accent-cream p-1 rounded-lg hover:bg-card-bg"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-bg-dark/40 flex items-center justify-center min-h-[320px]">
          {isDriveLink ? (
            <div className="text-center text-accent-mauve p-10">
              <HardDrive className="mx-auto mb-3" size={32} />
              <p className="text-sm mb-4">Đã lưu trên Google Drive.</p>
              <a
                href={storagePath!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-accent-blush text-bg-dark font-semibold text-sm px-4 py-2 rounded-xl hover:bg-accent-cream transition-colors"
              >
                <ExternalLink size={15} />
                Mở trên Google Drive
              </a>
            </div>
          ) : isLocalGeneratedDoc ? (
            <pre className="w-full h-full whitespace-pre-wrap break-words text-sm text-accent-cream p-6 font-body">
              {mdContent ?? "Đang tải nội dung..."}
            </pre>
          ) : storagePath && isVideo ? (
            <video
              src={storagePath}
              controls
              className="max-h-[60vh] w-full bg-black"
            />
          ) : storagePath && !isVideo ? (
            <iframe
              src={storagePath}
              className="w-full h-[60vh]"
              title={title}
            />
          ) : (
            <div className="text-center text-accent-mauve p-10">
              <FileWarning className="mx-auto mb-3" size={32} />
              <p className="text-sm">
                Chưa có file lưu trữ cho item demo này.
                <br />
                Trong bản production, {isVideo ? "video" : "tài liệu"} sẽ được
                phát trực tiếp từ Google Drive tại{" "}
                <code className="text-accent-blush">storagePath</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

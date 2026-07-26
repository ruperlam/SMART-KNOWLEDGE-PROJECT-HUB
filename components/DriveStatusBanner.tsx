import { HardDrive, CheckCircle2, AlertTriangle } from "lucide-react";

export default function DriveStatusBanner({
  connected,
  configured,
  justConnected,
  error,
}: {
  connected: boolean;
  configured: boolean;
  justConnected?: boolean;
  error?: string;
}) {
  if (justConnected) {
    return (
      <div className="bento-card px-4 py-3 flex items-center gap-2 text-status-green text-sm">
        <CheckCircle2 size={16} />
        Đã kết nối Google Drive — video Auto Ingest từ giờ sẽ tự lưu vào đúng thư mục Topic trên Drive.
      </div>
    );
  }

  if (error) {
    return (
      <div className="bento-card px-4 py-3 flex items-center gap-2 text-status-red text-sm">
        <AlertTriangle size={16} />
        Kết nối Google Drive thất bại: {error}
      </div>
    );
  }

  if (connected) return null;

  return (
    <div className="bento-card px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <span className="inline-flex items-center gap-2 text-sm text-accent-blush">
        <HardDrive size={16} />
        {configured
          ? "Chưa kết nối Google Drive — video Auto Ingest sẽ tạm lưu local."
          : "Chưa cấu hình Google Drive (xem GOOGLE_DRIVE_SETUP.md)."}
      </span>
      {configured && (
        <a
          href="/api/auth/google"
          className="inline-flex items-center gap-1.5 bg-accent-blush text-bg-dark font-semibold text-xs px-3 py-1.5 rounded-xl hover:bg-accent-cream transition-colors"
        >
          Kết nối Google Drive
        </a>
      )}
    </div>
  );
}

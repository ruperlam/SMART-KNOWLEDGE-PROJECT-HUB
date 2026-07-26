import { NextRequest, NextResponse } from "next/server";
import { checkYtdlpAvailable, downloadVideo } from "@/lib/ytdlp";

// Auto-Downloader (spec section 4B).
// For TikTok/YouTube/Facebook Reels we try a real download via yt-dlp
// (runs locally, talks directly to the platform's own CDN — no third-party
// proxy sees the URL). If yt-dlp isn't installed or the download fails, we
// fall back to metadata via oEmbed (TikTok/YouTube only) or just the link.
// The downloaded file is left in a local staging folder; POST /api/items
// moves it into the chosen topic's Google Drive folder (or a local folder
// if Drive isn't connected yet) once the user picks a topic.
type Meta = {
  title: string;
  thumbnailUrl: string | null;
  sourceType: string;
  storagePath: string | null;
  fileSizeMb: number;
  note: string;
  tempFile: { tempId: string; fileName: string; ext: string } | null;
};

async function fetchOEmbed(
  oembedUrl: string
): Promise<{ title?: string; thumbnail_url?: string } | null> {
  try {
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function fallbackTitle(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last).replace(/[-_]/g, " ") : u.hostname;
  } catch {
    return url.slice(0, 60);
  }
}

async function tryYtdlp(
  url: string,
  sourceType: string,
  oembedThumbnail: string | null,
  fallback: string
): Promise<Meta> {
  const available = await checkYtdlpAvailable();
  if (!available) {
    return {
      title: fallback,
      thumbnailUrl: oembedThumbnail,
      sourceType,
      storagePath: null,
      fileSizeMb: 0,
      note: "Chưa cài yt-dlp — chỉ lưu link/metadata. Xem GOOGLE_DRIVE_SETUP.md để cài.",
      tempFile: null,
    };
  }

  try {
    const result = await downloadVideo(url);
    return {
      title: result.title || fallback,
      thumbnailUrl: oembedThumbnail,
      sourceType,
      storagePath: null,
      fileSizeMb: result.fileSizeMb,
      note: "Đã tải video qua yt-dlp — sẽ lưu vào Google Drive khi bạn chọn topic.",
      tempFile: { tempId: result.tempId, fileName: result.fileName, ext: result.ext },
    };
  } catch (e) {
    return {
      title: fallback,
      thumbnailUrl: oembedThumbnail,
      sourceType,
      storagePath: null,
      fileSizeMb: 0,
      note: `yt-dlp không tải được video này (${(e as Error).message.slice(0, 120)}) — chỉ lưu link.`,
      tempFile: null,
    };
  }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  let meta: Meta;

  if (/tiktok\.com/i.test(host)) {
    const data = await fetchOEmbed(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    );
    meta = await tryYtdlp(
      url,
      "TIKTOK",
      data?.thumbnail_url ?? null,
      data?.title ?? fallbackTitle(url)
    );
  } else if (/youtube\.com|youtu\.be/i.test(host)) {
    const data = await fetchOEmbed(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    meta = await tryYtdlp(
      url,
      "YOUTUBE",
      data?.thumbnail_url ?? null,
      data?.title ?? fallbackTitle(url)
    );
  } else if (/facebook\.com|fb\.watch/i.test(host)) {
    meta = await tryYtdlp(url, "FACEBOOK_REELS", null, fallbackTitle(url));
  } else if (/threads\.net/i.test(host)) {
    meta = {
      title: fallbackTitle(url),
      thumbnailUrl: null,
      sourceType: "THREADS",
      storagePath: null,
      fileSizeMb: 0,
      note: "Threads chưa có oEmbed công khai và yt-dlp cũng chưa hỗ trợ tốt — chỉ lưu link.",
      tempFile: null,
    };
  } else if (/\.pdf($|\?)/i.test(url)) {
    meta = {
      title: fallbackTitle(url),
      thumbnailUrl: null,
      sourceType: "PDF",
      storagePath: url,
      fileSizeMb: 0,
      note: "Link PDF trực tiếp — có thể nhúng ngay qua storagePath.",
      tempFile: null,
    };
  } else {
    meta = {
      title: fallbackTitle(url),
      thumbnailUrl: null,
      sourceType: "OTHER",
      storagePath: null,
      fileSizeMb: 0,
      note: "Không nhận diện được platform — chỉ lưu link.",
      tempFile: null,
    };
  }

  return NextResponse.json(meta);
}

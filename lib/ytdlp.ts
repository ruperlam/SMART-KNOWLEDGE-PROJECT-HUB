import { spawn } from "child_process";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";

export const STAGING_DIR = path.join(process.cwd(), ".ingest-staging");

export function checkYtdlpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn("yt-dlp", ["--version"]);
    p.on("error", () => resolve(false));
    p.on("close", (code) => resolve(code === 0));
  });
}

export type YtdlpResult = {
  tempId: string;
  filePath: string;
  fileName: string;
  ext: string;
  title: string;
  thumbnailPath: string | null;
  fileSizeMb: number;
};

/** Downloads a video via yt-dlp into STAGING_DIR. Throws if yt-dlp is
 * missing or the download fails — callers should fall back to
 * metadata-only ingestion in that case. */
export async function downloadVideo(url: string): Promise<YtdlpResult> {
  await fs.mkdir(STAGING_DIR, { recursive: true });
  const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const outTemplate = path.join(STAGING_DIR, `${tempId}.%(ext)s`);

  const args = [
    "-f",
    "best[ext=mp4]/best",
    "-o",
    outTemplate,
    "--write-thumbnail",
    "--convert-thumbnails",
    "jpg",
    "--no-playlist",
    "--no-warnings",
    "--print-json",
    url,
  ];

  const stdout = await new Promise<string>((resolve, reject) => {
    const p = spawn("yt-dlp", args);
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(err || `yt-dlp exited with code ${code}`));
    });
  });

  const jsonLine = stdout
    .split("\n")
    .reverse()
    .find((line) => line.trim().startsWith("{"));
  if (!jsonLine) {
    throw new Error("Không đọc được metadata từ yt-dlp output");
  }
  const info = JSON.parse(jsonLine);

  const ext = info.ext ?? "mp4";
  const fileName = `${tempId}.${ext}`;
  const filePath = path.join(STAGING_DIR, fileName);
  if (!fssync.existsSync(filePath)) {
    throw new Error("yt-dlp báo thành công nhưng không thấy file tải về");
  }

  const thumbCandidate = path.join(STAGING_DIR, `${tempId}.jpg`);
  const thumbnailPath = fssync.existsSync(thumbCandidate) ? thumbCandidate : null;

  const stats = await fs.stat(filePath);

  return {
    tempId,
    filePath,
    fileName,
    ext,
    title: info.title ?? url,
    thumbnailPath,
    fileSizeMb: Math.round((stats.size / (1024 * 1024)) * 10) / 10,
  };
}

export async function cleanupStagingFile(tempId: string, ext: string) {
  await Promise.all([
    fs.rm(path.join(STAGING_DIR, `${tempId}.${ext}`), { force: true }),
    fs.rm(path.join(STAGING_DIR, `${tempId}.jpg`), { force: true }),
  ]);
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { isDriveConnected, uploadFileToDrive } from "@/lib/googleDrive";
import { STAGING_DIR, cleanupStagingFile } from "@/lib/ytdlp";

export async function GET(req: NextRequest) {
  const topicId = req.nextUrl.searchParams.get("topic");
  const status = req.nextUrl.searchParams.get("status");
  const q = req.nextUrl.searchParams.get("q");

  const items = await prisma.item.findMany({
    where: {
      ...(topicId ? { topicId } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { notes: { contains: q } },
              { channel: { name: { contains: q } } },
              { topic: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { channel: true, topic: true },
    orderBy: { addedAt: "desc" },
  });
  return NextResponse.json(items);
}

const MIME_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
};

const LOCAL_MEDIA_DIR = path.join(process.cwd(), "public", "local-media");

/** Fallback for when Google Drive isn't connected yet: keep the file
 * locally under public/local-media so nothing is lost. */
async function moveToLocalMedia(localPath: string, fileName: string): Promise<string> {
  await fs.mkdir(LOCAL_MEDIA_DIR, { recursive: true });
  const dest = path.join(LOCAL_MEDIA_DIR, fileName);
  await fs.rename(localPath, dest);
  return `/local-media/${fileName}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title,
    topicId,
    projectId,
    sourceType = "OTHER",
    storagePath,
    thumbnailUrl,
    notes,
    fileSizeMb,
    channelName,
    originalUrl,
    tempFile,
  }: {
    title: string;
    topicId: string;
    projectId?: string | null;
    sourceType?: string;
    storagePath?: string | null;
    thumbnailUrl?: string | null;
    notes?: string | null;
    fileSizeMb?: number;
    channelName?: string;
    originalUrl?: string | null;
    tempFile?: { tempId: string; fileName: string; ext: string } | null;
  } = body;

  if (!title || !topicId) {
    return NextResponse.json(
      { error: "title and topicId are required" },
      { status: 400 }
    );
  }

  let finalStoragePath = storagePath || null;
  let finalFileSizeMb = fileSizeMb ?? 0;
  let finalNotes = notes || null;

  // A video was already downloaded by yt-dlp into the local staging folder
  // (see /api/ingest/download). Now that the user has picked a topic, move
  // it into that topic's Google Drive folder — or keep it local if Drive
  // isn't connected yet.
  if (tempFile) {
    const localPath = path.join(STAGING_DIR, tempFile.fileName);
    const stat = await fs.stat(localPath).catch(() => null);
    if (stat) {
      finalFileSizeMb = Math.round((stat.size / (1024 * 1024)) * 10) / 10;
      const topic = await prisma.topic.findUnique({ where: { id: topicId } });

      if ((await isDriveConnected()) && topic) {
        try {
          const uploaded = await uploadFileToDrive(
            topicId,
            topic.name,
            localPath,
            tempFile.fileName,
            MIME_TYPES[tempFile.ext] ?? "application/octet-stream"
          );
          finalStoragePath = uploaded.webViewLink;
          finalNotes = `${finalNotes ? finalNotes + " — " : ""}Đã lưu trên Google Drive / ${topic.name}.`;
          await cleanupStagingFile(tempFile.tempId, tempFile.ext);
        } catch (e) {
          finalStoragePath = await moveToLocalMedia(localPath, tempFile.fileName);
          finalNotes = `${finalNotes ? finalNotes + " — " : ""}Upload Drive lỗi (${(e as Error).message.slice(0, 100)}), đã lưu local.`;
        }
      } else {
        finalStoragePath = await moveToLocalMedia(localPath, tempFile.fileName);
        finalNotes = `${finalNotes ? finalNotes + " — " : ""}Chưa kết nối Google Drive, đã lưu local tại public/local-media.`;
      }
    }
  }

  const resolvedChannelName = channelName || "Thêm thủ công";
  let channel = await prisma.channel.findFirst({
    where: { name: resolvedChannelName },
  });
  if (!channel) {
    channel = await prisma.channel.create({
      data: { name: resolvedChannelName, sourceType },
    });
  }

  const item = await prisma.item.create({
    data: {
      title,
      sourceType,
      topicId,
      projectId: projectId || null,
      channelId: channel.id,
      storagePath: finalStoragePath,
      thumbnailUrl: thumbnailUrl || null,
      notes: finalNotes,
      fileSizeMb: finalFileSizeMb,
      originalUrl: originalUrl || null,
    },
    include: { channel: true, topic: true },
  });

  return NextResponse.json(item, { status: 201 });
}

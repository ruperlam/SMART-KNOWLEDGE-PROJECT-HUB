import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { prisma } from "@/lib/prisma";
import { generateIdeaDocuments, buildMarkdown, buildDocx } from "@/lib/docGenerator";
import { slugify } from "@/lib/slug";
import { isDriveConnected, uploadFileToDrive } from "@/lib/googleDrive";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    refinedTitle,
    summary,
    actionSteps,
    suggestedKeywords = [],
    rawInput,
    topicId,
    projectId,
  } = body;

  if (!refinedTitle || !topicId) {
    return NextResponse.json(
      { error: "refinedTitle and topicId are required" },
      { status: 400 }
    );
  }

  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) {
    return NextResponse.json({ error: "topic not found" }, { status: 404 });
  }

  const ideaDoc = {
    refinedTitle,
    summary: summary ?? "",
    actionSteps: actionSteps ?? [],
    suggestedKeywords,
    topicName: topic.name,
    rawInput: rawInput ?? refinedTitle,
  };
  const baseName = `${slugify(refinedTitle)}-${Date.now()}`;

  let storagePath: string;
  let docNote: string;

  if (await isDriveConnected()) {
    // Ephemeral hosts (Render, etc.) wipe local disk on every redeploy/restart,
    // so once Drive is connected we always push generated docs there instead
    // of public/generated.
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "smartech-doc-"));
    const mdPath = path.join(tmpDir, `${baseName}.md`);
    const docxPath = path.join(tmpDir, `${baseName}.docx`);
    await fs.writeFile(mdPath, buildMarkdown(ideaDoc), "utf-8");
    await fs.writeFile(docxPath, await buildDocx(ideaDoc));

    try {
      const [mdUpload, docxUpload] = await Promise.all([
        uploadFileToDrive(topicId, topic.name, mdPath, `${baseName}.md`, "text/markdown"),
        uploadFileToDrive(
          topicId,
          topic.name,
          docxPath,
          `${baseName}.docx`,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
      ]);
      storagePath = mdUpload.webViewLink ?? "";
      docNote = `Đã lưu trên Google Drive / ${topic.name}. Bản .docx: ${docxUpload.webViewLink ?? ""}`;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  } else {
    const { mdUrl, docxUrl } = await generateIdeaDocuments(ideaDoc, baseName);
    storagePath = mdUrl;
    docNote = `Chưa kết nối Google Drive, đã lưu local. Bản .docx: ${docxUrl}`;
  }

  let channel = await prisma.channel.findFirst({
    where: { name: "AI Generated Docs" },
  });
  if (!channel) {
    channel = await prisma.channel.create({
      data: { name: "AI Generated Docs", sourceType: "WORD" },
    });
  }

  const item = await prisma.item.create({
    data: {
      title: refinedTitle,
      sourceType: "WORD",
      storagePath,
      notes: docNote,
      topicId,
      projectId: projectId || null,
      channelId: channel.id,
      status: "UNREAD",
    },
    include: { channel: true, topic: true },
  });

  if (suggestedKeywords[0]) {
    try {
      await prisma.userPreferenceRule.upsert({
        where: { keyword: suggestedKeywords[0] },
        update: { preferredTopicId: topicId, confidence: { increment: 0.05 } },
        create: { keyword: suggestedKeywords[0], preferredTopicId: topicId },
      });
    } catch {
      // best-effort
    }
  }

  return NextResponse.json({ item }, { status: 201 });
}

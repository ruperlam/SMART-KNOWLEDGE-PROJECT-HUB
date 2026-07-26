import fs from "fs/promises";
import path from "path";
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from "docx";

export type IdeaDoc = {
  refinedTitle: string;
  summary: string;
  actionSteps: string[];
  suggestedKeywords: string[];
  topicName: string;
  rawInput: string;
};

const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

export function buildMarkdown(doc: IdeaDoc): string {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    `# ${doc.refinedTitle}`,
    "",
    `- **Topic:** ${doc.topicName}`,
    `- **Ngày tạo:** ${date}`,
    `- **Từ khóa:** ${doc.suggestedKeywords.map((k) => `#${k}`).join(" ")}`,
    "",
    "## Ý tưởng gốc",
    "",
    doc.rawInput,
    "",
    "## Tóm tắt (Gemini)",
    "",
    doc.summary,
    "",
    "## Các bước hành động",
    "",
    ...doc.actionSteps.map((s, i) => `${i + 1}. ${s}`),
    "",
  ];
  return lines.join("\n");
}

export async function buildDocx(doc: IdeaDoc): Promise<Buffer> {
  const date = new Date().toISOString().slice(0, 10);
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: doc.refinedTitle,
            heading: HeadingLevel.TITLE,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Topic: ${doc.topicName}  |  Ngày tạo: ${date}`, italics: true }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Ý tưởng gốc", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: doc.rawInput }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Tóm tắt (Gemini)", heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: doc.summary }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "Các bước hành động", heading: HeadingLevel.HEADING_2 }),
          ...doc.actionSteps.map(
            (s, i) => new Paragraph({ text: `${i + 1}. ${s}` })
          ),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Từ khóa: ${doc.suggestedKeywords.map((k) => `#${k}`).join(" ")}`,
                italics: true,
                color: "854F6C",
              }),
            ],
          }),
        ],
      },
    ],
  });
  return Packer.toBuffer(document);
}

/** Writes {baseName}.md and {baseName}.docx into public/generated and returns
 * public-servable URLs (e.g. /generated/xyz.md). */
export async function generateIdeaDocuments(
  doc: IdeaDoc,
  baseName: string
): Promise<{ mdUrl: string; docxUrl: string }> {
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const mdContent = buildMarkdown(doc);
  const mdFile = `${baseName}.md`;
  await fs.writeFile(path.join(GENERATED_DIR, mdFile), mdContent, "utf-8");

  const docxBuffer = await buildDocx(doc);
  const docxFile = `${baseName}.docx`;
  await fs.writeFile(path.join(GENERATED_DIR, docxFile), docxBuffer);

  return { mdUrl: `/generated/${mdFile}`, docxUrl: `/generated/${docxFile}` };
}

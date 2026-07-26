import fssync from "fs";
import { google } from "googleapis";
import { prisma } from "./prisma";

// Token is stored in the database (AppSetting), not on local disk, so it
// survives redeploys on hosts with an ephemeral filesystem (Render, etc.).
const TOKEN_KEY = "google_oauth_token";
const ROOT_FOLDER_NAME = "Smartech Hub";
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

function getEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  return { clientId, clientSecret, redirectUri };
}

export function isGoogleConfigured(): boolean {
  const { clientId, clientSecret } = getEnv();
  return Boolean(clientId && clientSecret);
}

async function readToken(): Promise<Record<string, unknown> | null> {
  const row = await prisma.appSetting.findUnique({ where: { key: TOKEN_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

async function writeToken(tokens: object): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: TOKEN_KEY },
    update: { value: JSON.stringify(tokens) },
    create: { key: TOKEN_KEY, value: JSON.stringify(tokens) },
  });
}

export async function isDriveConnected(): Promise<boolean> {
  return (await readToken()) !== null;
}

function buildOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getEnv();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Thiếu GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET trong .env — xem GOOGLE_DRIVE_SETUP.md"
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function getAuthorizedClient() {
  const client = buildOAuthClient();
  const existing = await readToken();
  if (!existing) {
    throw new Error("Chưa kết nối Google Drive — bấm 'Kết nối Google Drive' trong app trước.");
  }
  client.setCredentials(existing);
  // Persist refreshed access tokens so we don't need to re-consent.
  client.on("tokens", async (tokens) => {
    try {
      const current = (await readToken()) ?? {};
      await writeToken({ ...current, ...tokens });
    } catch {
      // best-effort
    }
  });
  return client;
}

export function getAuthUrl(): string {
  const client = buildOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function handleOAuthCallback(code: string): Promise<void> {
  const client = buildOAuthClient();
  const { tokens } = await client.getToken(code);
  await writeToken(tokens);
}

async function getDrive() {
  const auth = await getAuthorizedClient();
  return google.drive({ version: "v3", auth });
}

async function findFolder(
  drive: Awaited<ReturnType<typeof getDrive>>,
  name: string,
  parentId?: string
): Promise<string | null> {
  const q = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    "trashed = false",
    parentId ? `'${parentId}' in parents` : "'root' in parents",
  ].join(" and ");
  const res = await drive.files.list({ q, fields: "files(id, name)", pageSize: 1 });
  return res.data.files?.[0]?.id ?? null;
}

async function createFolder(
  drive: Awaited<ReturnType<typeof getDrive>>,
  name: string,
  parentId?: string
): Promise<string> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  });
  if (!res.data.id) throw new Error("Không tạo được folder trên Drive");
  return res.data.id;
}

let cachedRootId: string | null = null;

async function ensureRootFolder(
  drive: Awaited<ReturnType<typeof getDrive>>
): Promise<string> {
  if (cachedRootId) return cachedRootId;
  const existing = await findFolder(drive, ROOT_FOLDER_NAME);
  cachedRootId = existing ?? (await createFolder(drive, ROOT_FOLDER_NAME));
  return cachedRootId;
}

/** Returns the Drive folder id mirroring a Topic, creating it (and caching
 * the id on the Topic row) the first time it's needed. */
export async function ensureTopicFolder(
  topicId: string,
  topicName: string
): Promise<string> {
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (topic?.driveFolderId) return topic.driveFolderId;

  const drive = await getDrive();
  const rootId = await ensureRootFolder(drive);
  const existing = await findFolder(drive, topicName, rootId);
  const folderId = existing ?? (await createFolder(drive, topicName, rootId));

  await prisma.topic.update({
    where: { id: topicId },
    data: { driveFolderId: folderId },
  });
  return folderId;
}

export async function uploadFileToDrive(
  topicId: string,
  topicName: string,
  localFilePath: string,
  fileName: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string | null }> {
  const drive = await getDrive();
  const folderId = await ensureTopicFolder(topicId, topicName);

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: fssync.createReadStream(localFilePath) },
    fields: "id, webViewLink",
  });

  if (!res.data.id) throw new Error("Upload Drive thất bại");
  return { id: res.data.id, webViewLink: res.data.webViewLink ?? null };
}

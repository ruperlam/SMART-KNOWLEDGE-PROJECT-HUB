import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/googleDrive";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  const base = req.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(`${base}/?drive_error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${base}/?drive_error=missing_code`);
  }

  try {
    await handleOAuthCallback(code);
    return NextResponse.redirect(`${base}/?drive_connected=1`);
  } catch (e) {
    return NextResponse.redirect(
      `${base}/?drive_error=${encodeURIComponent((e as Error).message)}`
    );
  }
}

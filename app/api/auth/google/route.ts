import { NextResponse } from "next/server";
import { getAuthUrl, isGoogleConfigured } from "@/lib/googleDrive";

// Starts the Google OAuth consent flow. The user clicks "Kết nối Google
// Drive" in the UI, which hits this route; we redirect to Google's consent
// screen. This requires the user to have already created OAuth credentials
// in their own Google Cloud Console — see GOOGLE_DRIVE_SETUP.md.
export async function GET() {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      {
        error:
          "Chưa cấu hình GOOGLE_CLIENT_ID/SECRET trong .env — xem GOOGLE_DRIVE_SETUP.md",
      },
      { status: 400 }
    );
  }
  return NextResponse.redirect(getAuthUrl());
}

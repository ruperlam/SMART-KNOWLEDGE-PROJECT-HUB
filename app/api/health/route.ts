import { NextResponse } from "next/server";

// Lightweight health-check endpoint that does NOT touch the database.
// Render (and any other host) should point its health check here instead of
// "/" — the dashboard page depends on Neon, which can take a few seconds to
// wake up from auto-suspend, and a slow "/" response can make a host think
// the whole container is unhealthy and restart it unnecessarily.
export async function GET() {
  return NextResponse.json({ ok: true });
}

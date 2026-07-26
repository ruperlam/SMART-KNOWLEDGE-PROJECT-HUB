// Runs once when the Next.js server process starts (stable in Next.js 14+).
// Safety net: if a stray async error from a dropped database connection ever
// slips past the retry logic in lib/prisma.ts and isn't attached to any
// in-flight request, Node's default behavior is to crash the whole process on
// an unhandled rejection/exception. That crash is what was causing the app to
// restart (and 502 for several seconds) every ~5 minutes when Neon's compute
// auto-suspends. Logging instead of crashing keeps the server serving other
// requests normally.
export function register() {
  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection] kept process alive:", reason);
  });
  process.on("uncaughtException", (err) => {
    console.error("[uncaughtException] kept process alive:", err);
  });
}

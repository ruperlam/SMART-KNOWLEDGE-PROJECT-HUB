/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output = a self-contained server bundle (only the files it
  // actually needs), which is what the Dockerfile copies into the final
  // image for Render.
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
    // Enables instrumentation.ts, which registers process-level error
    // handlers so a stray dropped-DB-connection error can't crash the whole
    // server (see instrumentation.ts for why this matters).
    instrumentationHook: true,
  },
};

export default nextConfig;

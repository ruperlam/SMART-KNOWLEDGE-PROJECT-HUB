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
  },
};

export default nextConfig;

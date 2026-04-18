import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Disable streaming metadata for every user agent. The streaming
  // <__next_metadata_boundary__> Suspense wrapper causes a server/client
  // hydration mismatch on Next.js 16.2.4 + Turbopack (different `hidden`
  // attribute between the server-rendered div and the hydrated one). Resolving
  // metadata inline instead of streaming it sidesteps the bug.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

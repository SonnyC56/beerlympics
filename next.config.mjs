import { dirname } from "path";
import { fileURLToPath } from "url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this project (a stray lockfile in $HOME would
  // otherwise confuse Next's workspace-root inference and the serverless bundle).
  outputFileTracingRoot: projectRoot,
  // Convex serves files from its own storage domain; allow remote media in <Image>.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.convex.cloud" },
      { protocol: "https", hostname: "*.convex.site" },
    ],
  },
  eslint: {
    // Don't fail production builds on lint; CI/typecheck guards correctness.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

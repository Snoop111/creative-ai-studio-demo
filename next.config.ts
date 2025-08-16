// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Demo-only: don’t fail the build on lint/TS issues
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // fine to keep
  reactStrictMode: true,
};

export default nextConfig;

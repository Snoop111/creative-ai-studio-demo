// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- DEMO ONLY: let builds pass even with ESLint/TS issues ---
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // -------------------------------------------------------------

  // keep defaults predictable (safe to leave on)
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;

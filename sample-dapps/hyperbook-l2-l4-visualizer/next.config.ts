import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["worker_threads"],
  reactStrictMode: false,
};

export default nextConfig;

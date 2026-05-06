import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "shops.nexoraxs.com",
    "localhost:3001",
    "127.0.0.1:3001",
  ],
  reactCompiler: true,
};

export default nextConfig;

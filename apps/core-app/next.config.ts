import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "app.nexoraxs.com",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  reactCompiler: true,
};

export default nextConfig;

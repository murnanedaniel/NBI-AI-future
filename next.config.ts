import type { NextConfig } from "next";

const isExport = process.env.NEXT_OUTPUT_EXPORT === "true";
const basePath = process.env.NEXT_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" } : {}),
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;

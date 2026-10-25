import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: `next build` emits ./out, served by nginx. No server, no API routes.
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Кружок с «N» в углу — только DevTools Next.js, не часть продукта.
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  partialPrefetching: true,
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

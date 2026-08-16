import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.WAGTAIL_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") ??
  "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["usrv-01"],
  images: {
    qualities: [75, 80],
  },
  async rewrites() {
    return [
      {
        // Proxy /media/* to the Django backend so frontend-hosted pages
        // can serve uploaded images, documents, and rendition files.
        source: "/media/:path*",
        destination: `${BACKEND_URL}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/draft/", "/_next/"],
      },
    ],
    sitemap: "https://mgdrywallusa.com/sitemap.xml",
  };
}

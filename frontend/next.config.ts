import type { NextConfig } from "next";

/**
 * Hostnames the Next.js dev server accepts cross-origin `/_next/*` requests
 * from (JS chunks, RSC, and the HMR websocket). Requests from any other host
 * are rejected with `403 Unauthorized`, which is what breaks the site behind a
 * reverse proxy / Cloudflare Tunnel.
 *
 * Sources, merged and de-duplicated:
 *   1. `ALLOWED_DEV_ORIGINS` — explicit, comma-separated hostnames
 *      (e.g. `usrv-01,localhost`).
 *   2. The hostname of the public site URL (`NEXT_PUBLIC_SITE_URL` / `SITE_URL`)
 *      — keeps the tunnel origin working even when `ALLOWED_DEV_ORIGINS` is not
 *      set for a given environment.
 *
 * This only affects `next dev`; `allowedDevOrigins` is ignored by production
 * builds, so the derivation has no effect on the deployed app.
 */
function getAllowedDevOrigins(): string[] {
  const explicit = (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  let siteHost: string | undefined;
  if (siteUrl) {
    try {
      siteHost = new URL(siteUrl).hostname;
    } catch {
      // Ignore malformed URLs; explicit origins still apply.
    }
  }

  return [...new Set([...explicit, ...(siteHost ? [siteHost] : [])])];
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: getAllowedDevOrigins(),
  images: {
    qualities: [75, 80],
  },
  // Edge-cache headers (US-008, ADR-0002) live in src/middleware.ts —
  // config-level `headers()` cannot override the Cache-Control Next
  // stamps on dynamically rendered pages; middleware response headers
  // are applied last and can.
};



export default nextConfig;

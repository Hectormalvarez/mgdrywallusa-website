import { NextRequest, NextResponse } from "next/server";

/**
 * Edge-cache headers for public HTML routes (US-008, ADR-0002).
 *
 * Pages are dynamically rendered, and Next.js stamps its own
 * `Cache-Control: no-cache, must-revalidate` on dynamic responses —
 * config-level `headers()` cannot override it. Proxy response
 * headers ARE applied last, so this is the supported way to make the
 * edge (Cloudflare) cache HTML.
 *
 * Directive choice (revised 2026-09-26, cache-analytics review F3):
 *   - `max-age=0` — browsers revalidate on every navigation. A purge
 *     cannot reach browser caches, so `max-age=0` is what keeps a
 *     published edit from hiding behind a visitor's local cache.
 *   - NO `s-maxage` — Cloudflare treats `s-maxage` as implying
 *     `proxy-revalidate` (RFC 9111 §4.2.4), which FORBIDS a shared
 *     cache from serving stale. With `s-maxage` present, the
 *     `stale-while-revalidate` directive is inert and every request
 *     past the TTL returned `cf-cache-status: EXPIRED` (blocking
 *     origin fetch). Verified in production: zero `updating`/`stale`
 *     responses in 16 days of analytics.
 *   - The Cloudflare edge TTL is NOT taken from this header — the
 *     Cache Rule (`scripts/cf-cache-rule.sh`) overrides it to 300s.
 *     That separation is Cloudflare's documented pattern for wanting
 *     a different browser and edge TTL.
 *   - `stale-while-revalidate=86400` — the edge serves the stale copy
 *     during revalidation instead of making the visitor wait for a
 *     full SSR render. Revalidation is asynchronous, so the next
 *     request after it completes gets a fresh HIT.
 *
 * Scope: only the three public routes. /api/* (preview, lead POST),
 * /admin/ (proxied before Next), and draft-mode requests are never
 * touched — draft previews must not be cacheable (the CF Cache Rule
 * additionally bypasses requests carrying the preview_token cookie).
 */
const PUBLIC_ROUTES = ["/", "/portfolio"];

/** Must match `edge_ttl.default` in scripts/cf-cache-rule.sh (300s). */
const STALE_WHILE_REVALIDATE_SECONDS = 86400;

const PUBLIC_CACHE_CONTROL =
  `public, max-age=0, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;


export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/portfolio/");

  if (isPublic) {
    response.headers.set("Cache-Control", PUBLIC_CACHE_CONTROL);
  }

  return response;
}

export const config = {
  // Run only on page routes; skip Next internals, API routes, and files.
  matcher: ["/((?!_next/static|_next/image|api/|images/|favicon.ico).*)"],
};

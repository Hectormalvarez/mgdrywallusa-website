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
 * Scope: only the three public routes. /api/* (preview, lead POST),
 * /admin/ (proxied before Next), and draft-mode requests are never
 * touched — draft previews must not be cacheable (the CF Cache Rule
 * additionally bypasses requests carrying the preview_token cookie).
 */
const PUBLIC_ROUTES = ["/", "/portfolio"];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/portfolio/");

  if (isPublic) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=86400",
    );
  }

  return response;
}

export const config = {
  // Run only on page routes; skip Next internals, API routes, and files.
  matcher: ["/((?!_next/static|_next/image|api/|images/|favicon.ico).*)"],
};

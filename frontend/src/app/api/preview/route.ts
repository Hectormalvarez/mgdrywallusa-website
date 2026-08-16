import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";

/**
 * Headless CMS preview entry-point.
 *
 * Wagtail `wagtail-headless-preview` redirects editors here:
 *   /api/preview?content_type=home.HomePage&token=<PagePreview.token>
 *
 * We validate the content type, activate Next.js Draft Mode, persist the
 * preview token in a cookie, then redirect to `/` where the page component
 * detects draft mode and fetches preview data from the backend.
 */
const ALLOWED_CONTENT_TYPES = ["home.homepage"] as const;

/**
 * Build the public origin for the redirect.
 *
 * Inside Docker, `request.url` resolves to the internal bind address
 * (e.g. `0.0.0.0:3000`), which is unreachable from the browser. We must
 * construct the redirect URL from the public-facing origin instead.
 *
 * Priority:
 * 1. `FRONTEND_URL` env var (explicit public origin, e.g. https://example.com)
 * 2. `Host` header (set by Nginx / reverse proxy or browser)
 *    - Uses `X-Forwarded-Proto` if present, otherwise defaults to `http`
 * 3. Fallback to `request.nextUrl.origin` (works in local dev without proxy)
 */
function getPublicOrigin(request: NextRequest): string {
  // 1. Explicit env var
  const envUrl = process.env.FRONTEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  // 2. Host header (with optional X-Forwarded-Proto)
  const host = request.headers.get("host");
  if (host) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "http";
    return `${forwardedProto}://${host}`;
  }

  // 3. Fallback
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const contentType = searchParams.get("content_type");

  // --- Token presence ---
  if (!token) {
    return NextResponse.json(
      { error: "Missing preview token" },
      { status: 401 },
    );
  }

  // --- Content-type whitelist ---
  if (!contentType || !(ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType)) {
    return NextResponse.json(
      { error: "Unsupported content type" },
      { status: 400 },
    );
  }

  // --- Activate Draft Mode ---
  const draft = await draftMode();
  draft.enable();

  // Persist the preview token so the page component can fetch draft data.
  const origin = getPublicOrigin(request);
  const response = NextResponse.redirect(new URL("/", origin));
  response.cookies.set("preview_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}

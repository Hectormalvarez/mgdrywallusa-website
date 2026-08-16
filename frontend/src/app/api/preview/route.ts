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
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("preview_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}

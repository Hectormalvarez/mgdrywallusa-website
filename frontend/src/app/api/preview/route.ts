import { NextRequest, NextResponse } from "next/server";
import { draftMode } from "next/headers";

/**
 * Headless CMS preview entry-point.
 *
 * Wagtail redirects editors here with ?content_type=home.HomePage&token=<secret>.
 * We validate the shared secret, activate Next.js Draft Mode, then redirect
 * to the front page which will detect draft mode and fetch preview data.
 */
const PREVIEW_SECRET = process.env.WAGTAIL_PREVIEW_SECRET ?? "";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const contentType = searchParams.get("content_type");

  // --- Token validation ---
  if (!PREVIEW_SECRET || token !== PREVIEW_SECRET) {
    return NextResponse.json(
      { error: "Invalid or missing preview token" },
      { status: 401 },
    );
  }

  // --- Content-type gate ---
  if (contentType !== "home.HomePage") {
    return NextResponse.json(
      { error: "Unsupported content type" },
      { status: 400 },
    );
  }

  // --- Activate Draft Mode ---
  const draft = await draftMode();
  draft.enable();

  // Redirect to home — the page will detect draft mode and fetch preview data.
  return NextResponse.redirect(new URL("/", request.url));
}

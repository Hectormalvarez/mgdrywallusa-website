/**
 * Typed API client for the Wagtail backend.
 */

import type { HomePageData, WagtailPagesResponse } from "@/types/home";

export interface WagtailPageMeta {
  type: string;
  detail_url: string;
}

export interface GalleryImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

export interface PortfolioItem {
  id: number;
  meta: WagtailPageMeta;
  title: string;
  description: string;
  scope: string;
  finish_tags: string[];
  featured_image_url: string | null;
  gallery_images: GalleryImage[];
}

export interface PortfolioApiResponse {
  meta: { total_count: number };
  items: PortfolioItem[];
}

/**
 * Submit a lead via multipart/form-data.
 */
export async function submitLead(
  formData: FormData,
  apiUrl: string
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error('Lead submission failed') as Error & {
      status: number;
      data: unknown;
    };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return { status: response.status, data };
}

/**
 * Fetch portfolio items from the Wagtail API.
 */
export async function fetchPortfolioItems(
  apiUrl: string
): Promise<PortfolioApiResponse> {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Failed to load portfolio: ${response.status}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Home Page
// ---------------------------------------------------------------------------

// Server-side only — avoids leaking the internal Docker-network URL to the
// browser.  Falls back to localhost for local `npm run dev` usage.
const WAGTAIL_API_BASE =
  process.env.WAGTAIL_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * Fetch the HomePage data from the Wagtail backend.
 *
 * @param draft    When `true`, fetches draft data via the preview endpoint
 *                 using the supplied token. When `false`, returns the
 *                 published version.
 * @param token    The `PagePreview.token` stored in the `preview_token` cookie.
 */
export async function fetchHomePage(
  draft: boolean,
  token?: string | null,
): Promise<HomePageData | null> {
  try {
    // --- Draft / preview path ---
    if (draft && token) {
      const res = await fetch(`${WAGTAIL_API_BASE}/home/preview/${token}/`);
      if (!res.ok) return null;
      return res.json() as Promise<HomePageData>;
    }

    // --- Published path ---
    const res = await fetch(
      `${WAGTAIL_API_BASE}/pages/?type=home.HomePage&fields=hero_kicker,hero_heading,hero_subheading,hero_image_url,cta_primary_label,cta_primary_url,cta_secondary_label,cta_secondary_url`,
    );
    if (!res.ok) return null;
    const body = (await res.json()) as WagtailPagesResponse;
    return body.items?.[0] ?? null;
  } catch {
    // Gracefully handle network errors (e.g. backend unreachable during SSR)
    return null;
  }
}

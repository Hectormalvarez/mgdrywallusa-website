/**
 * Typed API client for the Wagtail backend.
 */

import { cache } from "react";
import type { HomePageData, WagtailPagesResponse } from "@/types/home";
import type { SiteSettingsData } from "@/types/settings";

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
// Site Settings
// ---------------------------------------------------------------------------

// Server-side only — avoids leaking the internal Docker-network URL to the
// browser.  Falls back to localhost for local `npm run dev` usage.
const WAGTAIL_API_BASE =
  process.env.WAGTAIL_API_BASE_URL ?? "http://localhost:8000/api/v1";

/** Fallback settings used when the backend is unreachable. */
const SITE_SETTINGS_FALLBACK: SiteSettingsData = {
  site_name: "MG Drywall USA",
  tagline:
    "Professional drywall installation, repair, and finishing for residential and commercial projects across the nation.",
  phone_number: "+1-555-DRYWALL",
  contact_email: "info@mgdrywallusa.com",
  license_number: "",
  logo_url: null,
  favicon_url: null,
  primary_color: "#0A3161",
  accent_color: "#B31942",
  banner_enabled: false,
  banner_text: "",
  banner_link: "#lead-form",
  google_review_url: "",
  yelp_url: "",
  facebook_url: "",
  instagram_url: "",
  seo: {
    address_locality: "Austin",
    address_region: "TX",
    postal_code: "78701",
    country: "US",
    price_range: "$$",
  },
  nav: [
    { label: "Services", href: "#services" },
    { label: "Our Work", href: "#portfolio" },
    { label: "Contact", href: "#lead-form" },
  ],
};

/**
 * Fetch global site settings from the Wagtail backend.
 *
 * Returns a hard-coded fallback when the backend is unreachable so that
 * the layout (Header / Footer / metadata) can still render during local
 * development or if the API is temporarily down.
 *
 * Wrapped with `react.cache` so multiple callers in the same server request
 * (e.g. `generateMetadata` + `RootLayout`) share a single fetch.
 */
export const fetchSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  try {
    const res = await fetch(`${WAGTAIL_API_BASE}/settings/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return (await res.json()) as SiteSettingsData;
  } catch (error) {
    console.error("[Settings Fetch Error]", error);
    return SITE_SETTINGS_FALLBACK;
  }
});

// ---------------------------------------------------------------------------
// Home Page

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
      const res = await fetch(`${WAGTAIL_API_BASE}/preview/${token}/`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return res.json() as Promise<HomePageData>;
    }

    // --- Published path ---
    const res = await fetch(
      `${WAGTAIL_API_BASE}/pages/?type=home.HomePage&fields=hero_kicker,hero_heading,hero_subheading,hero_image,cta_primary_label,cta_primary_url,cta_secondary_label,cta_secondary_url,services_heading,services_subheading,services,portfolio_heading,portfolio_empty_text,lead_section_heading,lead_section_description`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as WagtailPagesResponse;
    return body.items?.[0] ?? null;
  } catch {
    // Gracefully handle network errors (e.g. backend unreachable during SSR)
    return null;
  }
}

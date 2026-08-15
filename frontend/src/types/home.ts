/**
 * Shape of a single Wagtail ImageRendition returned by the API.
 */
export interface ImageRendition {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Fields exposed by the HomePage model via Wagtail API (api_fields).
 */
export interface HomePageData {
  hero_kicker: string;
  hero_heading: string;
  hero_subheading: string;
  hero_image_url: ImageRendition | null;
  cta_primary_label: string;
  cta_primary_url: string;
  cta_secondary_label: string;
  cta_secondary_url: string;
}

/**
 * Wagtail pages API response wrapper.
 */
export interface WagtailPagesResponse {
  meta: { total_count: number };
  items: Array<{ id: number; meta: { type: string }; title: string } & HomePageData>;
}

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
 * Shape of a single service item from the CMS.
 */
export interface ServiceItem {
  title: string;
  description: string;
  icon_name: string;
}

/**
 * Fields exposed by the HomePage model via Wagtail API (api_fields).
 */
export interface HomePageData {
  id: number;
  title: string;
  hero_kicker?: string;
  hero_heading?: string;
  hero_subheading?: string;
  hero_image?: ImageRendition | null;
  cta_primary_label?: string;
  cta_primary_url?: string;
  cta_secondary_label?: string;
  cta_secondary_url?: string;
  // Services
  services_heading?: string;
  services_subheading?: string;
  services?: ServiceItem[];
  // Portfolio & Lead
  portfolio_heading?: string;
  portfolio_empty_text?: string;
  lead_section_heading?: string;
  lead_section_description?: string;
}

/**
 * Wagtail pages API response wrapper.
 */
export interface WagtailPagesResponse<T = HomePageData> {
  meta: { total_count: number };
  items: T[];
}

/**
 * Global site settings returned by /api/v1/settings/.
 */

export interface SiteSeoSettings {
  address_locality: string;
  address_region: string;
  postal_code: string;
  country: string;
  price_range: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface SiteSettingsData {
  site_name: string;
  tagline: string;
  phone_number: string;
  contact_email: string;
  license_number: string;
  // Branding
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  // Banner
  banner_enabled: boolean;
  banner_text: string;
  banner_link: string;
  // Social links
  google_review_url: string;
  yelp_url: string;
  facebook_url: string;
  instagram_url: string;
  // SEO & nav
  seo: SiteSeoSettings;
  nav: NavItem[];
}

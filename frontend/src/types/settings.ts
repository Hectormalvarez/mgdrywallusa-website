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
  seo: SiteSeoSettings;
  nav: NavItem[];
}

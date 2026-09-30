import type { HomePageData, ServiceItem } from "@/types/home";
import type { SiteSettingsData } from "@/types/settings";

/**
 * Single source of truth for the demo/brand fallback content (ADR-0004).
 *
 * When the backend is unreachable (or a field is empty) the UI renders these
 * values so pages never break. They are deliberately labelled as replace-me
 * demo content: a new client rebrands by editing the CMS, and this module is
 * the only code location that carries fallback copy.
 *
 * Client-safe by contract: this module is imported by components and by
 * `@/lib/api` (which `LeadIntakeForm` uses), so it must never import
 * server-only machinery such as `next/headers`.
 */

/** Hero/OG image used when no CMS image is set. */
export const HERO_IMAGE_FALLBACK = "/images/hero.png";

/** Site chrome fallback used when the backend is unreachable (`fetchSiteSettings`). */
export const SITE_SETTINGS_FALLBACK: SiteSettingsData = {
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
    business_schema_type: "",
  },
  nav: [
    { label: "Services", href: "#services" },
    { label: "Our Work", href: "#portfolio" },
    { label: "Contact", href: "#lead-form" },
  ],
};

/** Hero copy fallback used when the homepage fields are empty. */
export const HERO_FALLBACK: Required<
  Pick<
    HomePageData,
    | "hero_kicker"
    | "hero_heading"
    | "hero_subheading"
    | "cta_primary_label"
    | "cta_primary_url"
    | "cta_secondary_label"
    | "cta_secondary_url"
  >
> = {
  hero_kicker: "Trusted drywall professionals",
  hero_heading: "MG Drywall USA",
  hero_subheading:
    "Professional drywall installation, repair, and finishing for residential and commercial projects.",
  cta_primary_label: "Get a Free Quote",
  cta_primary_url: "#lead-form",
  cta_secondary_label: "View Our Work",
  cta_secondary_url: "#portfolio",
};

/** Services section copy fallback. */
export const SERVICES_HEADING_FALLBACK = "Our Services";
export const SERVICES_SUBHEADING_FALLBACK =
  "Specialized drywall installation, repair, and finishing solutions tailored to residential and commercial needs.";

/** Services grid fallback used when the homepage defines no services. */
export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    name: "Level 5 Finishing",
    slug: "level-5-finishing",
    short_description:
      "Flawless, glass-smooth surfaces for high-end residential interiors and architectural accent walls.",
    icon: "paint",
  },
  {
    name: "Drywall Repair & Patching",
    slug: "drywall-repair-patching",
    short_description:
      "Seamless water damage repairs, stress crack fixes, and texture-matching for ceilings and walls.",
    icon: "patch",
  },
  {
    name: "ADU & Renovation Framing",
    slug: "adu-renovation-framing",
    short_description:
      "Full-service drywall hanging and finishing for garage conversions, room additions, and basements.",
    icon: "wall",
  },
];

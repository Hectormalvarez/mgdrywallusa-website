// @ts-check
/**
 * Dependency-free mock of the Wagtail API for Playwright E2E tests.
 *
 * Serves /api/v1/pages/ (home + portfolio). The portfolio dataset is selected
 * per request via the `X-E2E-Scenario` header — no server-global state, so
 * parallel workers/contexts are fully isolated. Runs on http://localhost:8000
 * by default (override via MOCK_PORT).
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 8000);

// ---------------------------------------------------------------------------
// Portfolio datasets (scenarios)
// ---------------------------------------------------------------------------

const sampleProject = {
  id: 1,
  slug: "sample-project",
  title: "Sample Project",
  description: "<p>A <strong>complete</strong> drywall project.</p>",
  scope: "residential",
  scope_label: "Residential",
  finish_tags: ["Level 5", "Smooth"],
  featured_image: {
    thumbnail: "/media/thumb.webp",
    card: "/media/card.webp",
    full: "/media/full.webp",
    alt: "Sample Project",
  },
  gallery_images: [
    {
      id: 1,
      image: {
        thumbnail: "/media/g-thumb.webp",
        card: "/media/g-card.webp",
        full: "/media/g-full.webp",
        alt: "Gallery photo",
      },
      caption: "Finished wall",
    },
  ],
};

const SCENARIOS = {
  // Detail-page dataset (also the default).
  default: [sampleProject],

  // Two-item dataset for the /portfolio listing page assertions.
  "listing-page": [
    {
      id: 1,
      slug: "residential-project",
      title: "Residential Project",
      description: "<p>A home remodel.</p>",
      scope: "residential",
      scope_label: "Residential",
      finish_tags: ["Level 5"],
      featured_image: null,
      gallery_images: [],
    },
    {
      id: 2,
      slug: "commercial-project",
      title: "Commercial Project",
      description: "<p>An office buildout.</p>",
      scope: "commercial",
      scope_label: "Commercial",
      finish_tags: [],
      featured_image: null,
      gallery_images: [],
    },
  ],

  // Listing dataset with a description/caption/tags to assert against.
  listing: [
    {
      id: 1,
      slug: "sample-project",
      title: "Sample Project",
      description: "<p>A sample <strong>drywall</strong> project.</p>",
      scope: "residential",
      scope_label: "Residential",
      finish_tags: ["Drywall", "Paint"],
      featured_image: {
        thumbnail: "/media/fill-150x150/hero.webp",
        card: "/media/fill-800x600/hero.webp",
        full: "/media/max-1600x1200/hero.webp",
        alt: "Sample Project",
      },
      gallery_images: [
        {
          id: 1,
          image: {
            thumbnail: "/media/fill-150x150/gallery.webp",
            card: "/media/fill-800x600/gallery.webp",
            full: "/media/max-1600x1200/gallery.webp",
            alt: "Gallery photo",
          },
          caption: "Finished living room wall",
        },
      ],
    },
  ],

  "empty-fields": [
    {
      id: 2,
      slug: "no-description-project",
      title: "No Description Project",
      description: "",
      scope: "residential",
      scope_label: "Residential",
      finish_tags: [],
      featured_image: null,
      gallery_images: [
        {
          id: 2,
          image: {
            thumbnail: "/media/fill-150x150/gallery.webp",
            card: "/media/fill-800x600/gallery.webp",
            full: "/media/max-1600x1200/gallery.webp",
            alt: "",
          },
          caption: "",
        },
      ],
    },
  ],

  // Seven items so the listing page (pageLimit=6) shows a "Load More" button.
  pagination: Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    slug: `project-${i + 1}`,
    title: `Project ${i + 1}`,
    description: "",
    scope: "residential",
    scope_label: "Residential",
    finish_tags: [],
    featured_image: null,
    gallery_images: [],
  })),

  tags: [
    { id: 1, slug: "project-a", title: "Project A", description: "", scope: "residential", scope_label: "Residential", finish_tags: ["Level 5", "Smooth"], featured_image: null, gallery_images: [] },
    { id: 2, slug: "project-b", title: "Project B", description: "", scope: "commercial", scope_label: "Commercial", finish_tags: ["Level 4"], featured_image: null, gallery_images: [] },
    { id: 3, slug: "project-c", title: "Project C", description: "", scope: "residential", scope_label: "Residential", finish_tags: ["Smooth"], featured_image: null, gallery_images: [] },
  ],
};

// ---------------------------------------------------------------------------
// Static resources
// ---------------------------------------------------------------------------


const HOME_PAGE = {
  hero_kicker: "Trusted drywall professionals",
  hero_heading: "MG Drywall USA",
  hero_subheading: "Professional drywall installation, repair, and finishing.",
  hero_image: null,
  cta_primary_label: "Get a Free Quote",
  cta_primary_url: "#lead-form",
  cta_secondary_label: "View Our Work",
  cta_secondary_url: "#portfolio",
  services_heading: "Our Services",
  services_subheading: "Expert drywall solutions.",
  featured_services: [],
  portfolio_heading: "Our Work",
  portfolio_empty_text: "No projects to display yet.",
  lead_section_heading: "Request a Quote",
  lead_section_description: "Tell us about your project.",
  // Site chrome (US-007) — served from the homepage's api_fields.
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

// ---------------------------------------------------------------------------
// State + HTTP server
// ---------------------------------------------------------------------------

/**
 * Resolve the portfolio dataset per request.
 *
 * The scenario comes from the `X-E2E-Scenario` request header (injected by the
 * Playwright fixture on browser→mock fetches and forwarded by the Next server
 * components on SSR fetches). There is deliberately NO server-global state:
 * parallel workers and concurrent contexts each carry their own scenario.
 */
const SCENARIO_HEADER = "x-e2e-scenario";

/**
 * @param {import("node:http").IncomingMessage} req
 * @returns {keyof typeof SCENARIOS | "error"}
 */
function resolveScenario(req) {
  const name = /** @type {string | undefined} */ (req.headers[SCENARIO_HEADER]);
  if (name === "error" || Object.prototype.hasOwnProperty.call(SCENARIOS, name)) {
    return /** @type {keyof typeof SCENARIOS | "error"} */ (name);
  }
  return "default";
}

/**
 * @param {import("node:http").ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // CORS — client-side fetches (NEXT_PUBLIC_WAGTAIL_API_URL) hit this server.
  // X-E2E-Scenario must be allowed: the Playwright fixture injects it onto
  // browser→mock API requests, which triggers a CORS preflight.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-E2E-Scenario");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- Pages ---
  if (url.pathname === "/api/v1/pages/") {
    const type = url.searchParams.get("type");
    const scenario = resolveScenario(req);

    if (type === "home.HomePage") {
      json(res, 200, { items: [HOME_PAGE] });
      return;
    }

    if (type === "portfolio.PortfolioItem") {
      if (scenario === "error") {
        json(res, 500, { error: "Server error" });
        return;
      }
      const items = SCENARIOS[/** @type {keyof typeof SCENARIOS} */ (scenario)] ?? SCENARIOS.default;
      const slug = url.searchParams.get("slug");
      const limit = Number(url.searchParams.get("limit") ?? "999999");
      const offset = Number(url.searchParams.get("offset") ?? "0");

      const result = slug
        ? items.filter(/** @param {{ slug: string }} item */ (item) => item.slug === slug)
        : items.slice(offset, offset + limit);

      json(res, 200, { meta: { total_count: items.length }, items: result });
      return;
    }

    json(res, 200, { items: [] });
    return;
  }

  json(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`[mock-backend] listening on http://localhost:${PORT}`);
});



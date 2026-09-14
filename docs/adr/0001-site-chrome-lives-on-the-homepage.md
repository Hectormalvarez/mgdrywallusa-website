# ADR 0001 — Site chrome lives on the homepage

Date: 2026-09-14 · Status: Accepted

## Context

The owner wants to customize the whole site — navigation, banner, brand
colors, contact details, social links — and to see a live preview of those
edits exactly like the page editor provides for page content.

The chrome originally lived in `SiteSettings` (a Wagtail settings model).
Settings models have **no draft state**: every save is instantly live, and
Wagtail's page-preview machinery is bound to page data only. US-006 worked
around this with a transient token store and an "open in a new tab"
preview, which — after fixing a script parse bug — functioned but never
felt like the page-editor preview the owner asked for.

## Decision

Visitor-facing site chrome (identity, branding, navigation, banner,
social links, local SEO) **moved onto `HomePage`** — the site's root page —
as page fields with a tabbed editor ("Page content / Header & footer /
Brand & contact"). The frontend reads chrome from the homepage's API
fields (`fetchSiteSettings` now fetches the homepage payload), and draft
previews ride the standard page-preview token.

Operational-only configuration (lead alert emails, auto-responder) stays
in `SiteSettings`; it never renders on the public site and needs no
preview.

## Consequences

- The owner edits and live-previews the entire site from one place
  (Edit Home), with the preview panel updating as they type.
- Chrome changes gain **draft → publish → revisions** semantics: a bad
  nav edit is now reversible instead of instantly live.
- The US-006 machinery (SettingsPreview model, admin button, token
  endpoints, draft cookie branch) was removed; the page-preview token is
  the single preview mechanism.
- The API contract keeps its shape: chrome fields plus `nav` (label/href)
  and nested `seo` are exposed on the homepage; the frontend type was
  unchanged, only its source moved.
- A transient window exists during deploys between backend migration and
  frontend replacement where the old frontend may briefly read chrome
  keys from an endpoint that no longer carries them; consumers fall back
  to defaults.

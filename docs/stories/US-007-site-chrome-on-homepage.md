# US-007 — Site chrome on the homepage (fully customizable site)

**Status:** Done (2026-09-14) · **Priority:** 1

## Story

> As the site owner, when I edit the Home page I want to customize the
> navigation, banner, branding, and contact details there and see them in
> the live preview panel, so that the whole site is customizable in one
> place with page-editor semantics.

## Acceptance criteria — all verified

1. **Given** the Edit Home view, **when** I open the "Header & footer" and
   "Brand & contact" tabs, **then** I can edit navigation, banner, identity,
   branding, social, and SEO fields there.
2. **Given** unsaved chrome edits, **when** I open the live preview, **then**
   the preview renders the unsaved values (verified: draft phone renders,
   live site unchanged).
3. **Given** a published chrome change, **when** I view any page, **then**
   the change appears site-wide (header/footer consume the homepage payload).
4. **Edge:** **given** an expired/invalid preview token or unreachable
   backend, **when** any page renders, **then** chrome falls back to defaults
   without breaking the page.

## Notes

- Supersedes US-006 (settings-preview machinery removed).
- Decision recorded in `docs/adr/0001-site-chrome-lives-on-the-homepage.md`.
- Operational settings (lead alerts, auto-responder) remain in Site Settings.

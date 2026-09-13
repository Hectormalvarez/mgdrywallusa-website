# US-006 — See settings changes before they go live

**Status:** Done (2026-09-13) · **Priority:** 3 (before the US-005 walkthrough) · **Depends on:** —  
**Origin:** owner request, 2026-09-13 — "when you edit site settings you can't see the live preview like you do when you edit the rest of the page."

## Description

> **As the** site owner, **when** I edit site settings, **I want** to see a live preview of the site with my unsaved changes, **so that** I never publish a mistake to the live site.

## Context (verified 2026-09-13)

Pages have a real draft→preview loop: Wagtail headless preview → `/api/preview?token=…` → Next.js Draft Mode → the page fetches draft content by token (`PagePreviewAPIView` in `backend/site_settings/views.py`).

**SiteSettings has none of this.** It is not a page, so there is no preview token, no preview panel in the settings edit view, and **every save applies instantly to the live site**. The page preview also renders header/footer chrome from the last *saved* settings, never from unsaved edits.

## Acceptance Criteria

1. **Given** I am editing Site Settings with unsaved changes (nav labels, banner text/enabled, colors, contact info), **when** I open the preview, **then** I see the site rendered with those unsaved values — not the last-saved ones.
2. **Given** an unsaved preview, **when** I close it without saving, **then** nothing has gone live — previewing must never have side effects.
3. **Edge:** **given** the preview fails to render, **then** I get a clear message and the form keeps my edits — a broken preview never blocks editing.
4. **Given** I save, **then** the live site matches what the preview showed.

## Mechanism options (for the Architect gate)

| Option | Assessment |
|---|---|
| **Honest unsaved-preview** — admin panel POSTs the form's current values to a transient preview endpoint; frontend renders in draft mode against that payload | True MVP of the want; moderate build — recommended leaning |
| Saved-state iframe in the settings edit view | Rejected: shows saved settings, not the editor's unsaved edits |
| Revisioned/draft-able SiteSettings (snippet with revisions) | Most Wagtail-native, heaviest; likely over-MVP unless the Architect justifies it |

## Out of scope

- Alternative editing locations for settings (editing convenience is a separate concern).
- Scheduled publishing, multi-user roles.

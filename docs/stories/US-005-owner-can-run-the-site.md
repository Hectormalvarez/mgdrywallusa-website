# US-005 — Owner can run the site without a developer

**Status:** In Progress — backend pre-verification passed (publish/unpublish/invalid-save verified programmatically 2026-09-13); owner walkthrough pending · **Priority:** 4 · **Depends on:** —

## Description

> **As the** site owner (non-technical),
> **I want** to edit homepage and portfolio content, preview it, publish it, and see it on the live site,
> **so that** I can keep the site current without raising a ticket.

## Context & Scope

The admin was verified reachable (2026-09-13: "Edit Home" dead link fixed; local DB now matches production). What has never been walked end-to-end is the **business loop**: edit → preview → publish → see live, for both homepage and portfolio, including undoing a mistake.

**In scope**
- The edit → preview → publish loop for the homepage and portfolio items, verified end-to-end as a business user.
- Unpublishing behaves sensibly (content disappears without breaking pages).

**Out of scope (MVP trims)**
- Approval workflows, scheduled publishing, multi-user roles, media library reorganisation.

## Acceptance Criteria

1. **Given** a draft homepage edit, **when** I preview, **then** I see it rendered exactly as visitors would; **when** I publish, **then** the live site shows it.
2. **Given** a new portfolio item, **when** I publish it, **then** it appears in "Our Work" and the listing page; **when** I unpublish it, **then** it disappears from both without breaking either page.
3. **Edge:** **Given** content that fails validation, **when** I save, **then** I get a clear, human message and the live page is untouched.

## Technical Guidance

For QA. Headless preview exists (`wagtail-headless-preview`, `/api/preview/` token flow, `/api/preview` Next.js route via Nginx). Walk this as a business user through the Cloudflare/Nginx entry point, not `docker exec` — the preview URL routing is part of the flow being verified.

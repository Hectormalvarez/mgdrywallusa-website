# US-008 — The site is fast on every visit, and edits show up instantly

**Status:** Draft · **Priority:** 1 · **Depends on:** none (first infra sprint after US-007)

## Description

> **As the** business owner,
> **I want** the website to load instantly for repeat visitors and to show my CMS edits the moment I publish,
> **so that** prospective customers never wait on a slow page, and I never wonder whether the live site is showing my latest content.

## Context & Scope

The site currently re-does all the work of building every page for every single visitor: only ~5% of requests are served from Cloudflare's cache, and measured pages re-contact the content backend on every view. This story makes public pages cacheable so repeat visits are near-instant, while guaranteeing that publishing in the admin updates the live site immediately rather than "eventually".

**In scope**
- Public pages (homepage, portfolio listing, portfolio details) served from cache on repeat visits.
- Publishing content (pages or site settings) updates the live site immediately.
- A way to measure cache performance over time, so improvement is provable.
- Consistent cache rules for site media and admin/preview areas (admin and preview must never be cached publicly).

**Out of scope (MVP trims)**
- No CDN-level image optimization changes beyond what already exists.
- No changes to the lead form behavior or its security protections.
- No redesign of any page; nothing visual changes for visitors.
- No historical analytics dashboards — a simple on-demand stats report is enough for now.

## Acceptance Criteria

1. **Given** a public page (homepage, portfolio listing, or a portfolio detail), **when** the same visitor (or any visitor) requests it again, **then** it is served from a cache rather than rebuilt from scratch, and it is verifiably marked as cacheable in its response.
2. **Given** the owner publishes a change to the homepage, a portfolio item, or site settings, **when** a visitor loads the affected page immediately afterwards, **then** the visitor sees the new content, not the previous version.
3. **Given** the admin area, the content preview flow, and the quote form, **when** any of these are used, **then** their responses remain private/uncacheable exactly as today (no behavior change).
4. **Given** a report of Cloudflare cache statistics for any recent period, **when** the owner runs the provided report command, **then** they can see how many requests were served from cache versus from the server, and the cached share is materially higher than today's ~5%.
5. **Edge:** **Given** the content backend is temporarily unreachable, **when** a visitor loads a public page, **then** the page still renders (from cache or the existing graceful fallback) rather than showing an error.
6. **Edge:** **Given** the site is deployed (new version released), **when** visitors load pages afterwards, **then** they never receive content from a previous deployment's cache that the new deployment cannot serve.

## Technical Guidance

Filled by the Architect gate.

## Audit trail

Grounded in `templates/ux-audit.md` (2026-09-15): findings A1–A2 (critical — uncacheable HTML and per-visitor backend re-fetches), A3 (measured repeat-visit cost), A4 (media/static header inconsistency), constraints A5–A6.

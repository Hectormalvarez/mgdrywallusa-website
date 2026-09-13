# Project Brief — MGDrywall USA Website

## What this is

Marketing site for MG Drywall USA, a drywall & finishing contractor. Headless Wagtail CMS (owner-editable content) + Next.js visitor frontend, deployed behind Nginx + Cloudflare Tunnel with webhook-automated production deploys.

## The single success metric

A visitor with a drywall problem contacts the business. Every page and flow is judged by whether it moves someone toward the **quote form** or a **phone call**. Everything else is decoration.

## Primary users

1. **Visitors** — homeowners (primary) and commercial clients with drywall/finishing needs. Most arrive via local search, a large share on phones.
2. **Content owner (non-technical)** — manages homepage copy, portfolio projects, and lead intake via the Wagtail admin without developer help.

## Core product decisions (agreed 2026-09-13)

| Decision | Call | Rationale |
|---|---|---|
| Primary conversion | **Quote form first, phone always visible** | Form captures structured details + photo uploads (the leads app supports attachments); phone stays prominent for call-preferring customers. No new machinery required |
| `/portfolio` status | **First-class SEO destination** | It is a real multi-page surface (listing, detail, per-project) with real content. The README's "single-page landing page" description is stale and should be corrected |

## Scope boundaries

- **In scope:** visitor funnel (home, portfolio listing/detail, lightbox, lead form), content-owner admin flows, SEO basics for portfolio pages.
- **Out of scope (standing):** blog, testimonials, live chat, popups, multi-user roles, scheduled publishing, analytics instrumentation (parked until conversion definition is stable — it is now, so it is the natural next story after US-001/US-002).

## Source-of-truth documents

- Business acceptance criteria live in `docs/stories/` (US-001…US-005, see `progress.md`).
- Technical standards: `.clinerules/` (symlinked from the ai-prompts repo) — backend, frontend, and cross-stack sync rules are binding.

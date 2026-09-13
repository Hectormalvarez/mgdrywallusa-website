# US-002 — Phone number on every page

**Status:** Done (2026-09-13) · **Priority:** 2 · **Depends on:** —

## Description

> **As a** visitor who prefers to call,
> **I want** the business phone number visible on every page,
> **so that** I can call the moment I'm ready, without hunting.

## Context & Scope

Agreed conversion decision: form-first, **phone always visible** — for this trade a large share of customers phone rather than fill forms. The number is owner-managed content, not hardcoded copy.

**In scope**
- Phone visible on all visitor-facing pages at prominence equal to form-based contact.
- Number sourced from the owner's SiteSettings so updating it once updates it everywhere.

**Out of scope (MVP trims)**
- Click-to-call analytics/tracking.
- A separate contact page; call scheduling; callback requests.

## Acceptance Criteria

1. **Given** any visitor-facing page, **when** I view it, **then** the phone number is visible without scrolling to the footer.
2. **Given** the owner updates the phone number in site settings, **when** I next view any page, **then** the new number is shown everywhere.
3. **Edge:** **Given** the settings have no phone number, **when** the page renders, **then** the layout leaves no gap or broken placeholder — the phone affordance simply doesn't render.

## Technical Guidance

For the Architect persona. SiteSettings already expose `phone_number` through the settings API; SSR settings fetching is per-request cached (`fetchSiteSettings`) — placement should respect the established SSR/browser fetch layer split.

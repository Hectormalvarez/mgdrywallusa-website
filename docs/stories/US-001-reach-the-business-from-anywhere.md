# US-001 — Reach the business from anywhere

**Status:** In Progress · **Priority:** 1 · **Depends on:** — · **Ships with:** US-003

## Description

> **As a** visitor who's been convinced by the work I've seen,
> **I want** a visible way to request a quote or call from wherever I am on the site,
> **so that** I don't have to find my way back to the homepage to contact the business.

## Context & Scope

Conversion decision (agreed 2026-09-13): **form-first, phone always visible**. The quote form is the primary conversion (structured details + photo uploads); the phone number stays visible for call-preferring customers — see US-002 for its sitewide placement.

**In scope**
- Every visitor-facing page carries a persistent, visible path to the quote form.
- Project detail and portfolio listing pages — the moments of maximum intent — have a contact action in view, not only in the header.
- The contact action is present and usable on narrow phone screens.

**Out of scope (MVP trims)**
- Duplicating the full quote form onto portfolio pages (path to the form, not another form).
- New pages, live chat, popups, announcement bars.
- Analytics tracking of the CTA (parked as the natural follow-up story once this ships).

## Acceptance Criteria

1. **Given** I'm on the portfolio listing or any project detail page, **when** I view it, **then** a visible path to request a quote is present **without** using the browser back button or leaving the page via header navigation.
2. **Given** I'm on any visitor-facing page, **when** I take the contact action, **then** I land with the quote form in view.
3. **Edge:** **Given** portfolio content fails to load on any page, **when** the page renders, **then** the contact path still renders (a broken gallery must never hide the way to hire us).
4. **Edge:** **Given** a narrow phone screen, **when** the contact action renders, **then** it is fully visible without horizontal scrolling or overlap.

## Technical Guidance

For the Architect persona. Known surface: portfolio listing and project detail are server-rendered pages; the lead form lives on the home page (`#lead-form`). Reachability of an anchor across pages is an established pattern (see `resolveNavHref` in `frontend/src/lib/nav.ts`).

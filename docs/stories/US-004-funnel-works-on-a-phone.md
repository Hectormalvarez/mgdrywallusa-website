# US-004 — The funnel works on a phone, not just in a test suite

**Status:** Draft · **Priority:** 3 · **Depends on:** US-001, US-002 (walk the funnel after the CTA/phone gaps are closed, so the walkthrough is of the real funnel)

## Description

> **As the** business owner,
> **I want** the entire visitor funnel verified on a real phone,
> **so that** mobile visitors — most local searches — don't hit breakage we can't see from a desktop test run.

## Context & Scope

Automated suites verify desktop Chrome; the sandbox's WebKit project is broken and no human has walked the funnel on a phone. This story is a walkthrough plus the small fixes it finds.

**In scope**
- A human walkthrough of land → filter → open project → photo lightbox → project detail → contact, on a phone or faithful emulation.
- Fixing whatever the walkthrough finds.

**Out of scope (MVP trims)**
- Features discovered along the way get recorded to the backlog, not built in this story.
- No new mobile-specific designs; no speculative breakpoints.

## Acceptance Criteria

1. **Given** the walkthrough above, **when** performed on a phone-sized viewport, **then** it completes with zero dead ends and no horizontal scrolling.
2. **Given** the lightbox and filter controls, **when** tapped with a thumb, **then** every target is comfortably tappable and its response is obvious.
3. **Given** the quote form on a phone, **when** I submit valid details, **then** I see a clear confirmation, and submission also succeeds on a throttled connection.
4. **Edge:** **Given** an interruption mid-form (rotate, keyboard dismiss), **when** I return, **then** my entered details are still there.

## Technical Guidance

For QA. Note the established environment quirks: e2e must run on free ports (`MOCK_PORT=8010 HOST_FRONTEND_PORT=3100`) and WebKit failures in this sandbox are environmental, not regressions. Findings route to the backlog via the bug template, each with REPRO + Expected/Actual.

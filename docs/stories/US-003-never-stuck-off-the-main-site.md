# US-003 — Never stuck off the main site

**Status:** Draft · **Priority:** 1 (ship with US-001 — same surface) · **Depends on:** —

## Description

> **As a** visitor browsing projects,
> **I want** a clear way home from any project detail page,
> **so that** I always feel oriented and never trapped in a sub-page.

## Context & Scope

**In scope**
- A visible home path on project detail pages.
- The same two orientation paths on the not-found page.

**Out of scope (MVP trims)**
- Full breadcrumb trails; navigation redesign; "related projects" modules.

## Acceptance Criteria

1. **Given** a project detail page, **when** I view it, **then** a visible link to the homepage is present alongside "← Back to Portfolio", **and** clicking it takes me to the homepage.
2. **Edge:** **Given** I visit a project URL that doesn't exist, **when** the not-found page renders, **then** it offers the same two paths (home and portfolio) — a dead end is not acceptable even on a 404.

## Technical Guidance

For the Architect persona. Portfolio listing already solved this via an optional `backLink` prop on `PortfolioSection`; project detail is a separate page surface (`/portfolio/[slug]`). The 404 surface is `app/not-found.tsx`.

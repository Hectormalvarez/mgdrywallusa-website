# Active Context — MGDrywall USA

*Updated: 2026-09-13. Read this file first when resuming.*

## Current focus

MVP sign-off pass on the user flow (PO scrutiny complete). Stories US-001…US-005 drafted in `docs/stories/` — priority order US-001 (+US-003) → US-002 → US-004 → US-005.

## Git state

- Branch `main`, **42 commits ahead of `origin/main`, unpushed** (push requires explicit user approval; pushing to `main` triggers production deploy).
- Working tree clean at commit `31725c9` (`70e1087` admin fix → memory bank init → stories → gitignore → README intent correction).

## Shipped this stretch (2026-09-12/13)

1. **Visitor nav fixes** — `src/lib/nav.ts` `resolveNavHref()` rewrites `#section` anchors to `/#section` off the home page; Header logo links home; Footer path-aware; logo uses `next/link`.
2. **Portfolio filters collapsed** — `ScopeFilterTabs`/`TagFilter` deleted; new `FilterMultiSelect` (two dropdowns, multi-select, Clear filters button that renders only when filters are active, inline with the "Our Work" heading, `align="right"` on the second dropdown so its panel stays on-screen).
3. **Lightbox overhauled** — enlarged obvious controls with hover-lit bar, focus trap + focus restore, `figure/figcaption` + `role="status"` counter, rich context panel (project link, scope badge, finish tags, captions with de-duplication), `LightboxSlide`/`LightboxProject` types exported from the modal.
4. **Portfolio page** — "← Back to Home" via optional `backLink` prop on `PortfolioSection`; homepage instance unaffected.
5. **Admin "Edit Home" fix** — `HomePage.get_home_for_site()`/`ensure_for_site()` helpers; `home/bootstrap.py` post_migrate hook (NOT a data migration — replacing a site root touches tables of every Page-subclass app + search index, which don't all exist mid-migration); `seed` creates the HomePage too; hook falls back to "Create Home" instead of `#`. Local DB now: `Home → Portfolio → 6 items`, site root = HomePage id 10, 3 services + featured links seeded.

## Next steps (in order)

1. **US-001 + US-003** — sitewide lead-conversion CTA + project-detail home link (approval gate: user).
2. **US-002** — sitewide phone visibility from SiteSettings.
3. **US-004** — human mobile walkthrough of the full funnel; record found issues to backlog.
4. **US-005** — owner edit→preview→publish walkthrough.
5. Regenerate the e2e visual baseline (`tests/e2e/visual/`) — **only once portfolio data renders via the real backend**; regenerating against the broken mock wiring would bake in a wrong baseline.
6. Correct the stale "single-page landing page" intent statement in README (part of this sign-off).
7. Push the 28 commits when the user approves (production deploy trigger!).

## Open items parked with the user

- Push approval (deploys to prod on push).
- Whether analytics/instrumentation story follows US-001/US-002 (PO says it's the natural next one).

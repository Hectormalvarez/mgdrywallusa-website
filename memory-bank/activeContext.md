# Active Context — MGDrywall USA

*Updated: 2026-09-13. Read this file first when resuming.*

## Current focus

**Feature pipeline in flight for US-001 + US-003, paused at Gate 3/4.** SDM breakdown approved; Architect constraints issued (verdict: Yes). Awaiting the combined Gate 3/4 human sign-off before the Developer gate starts writing code. **US-006 drafted** from the owner (settings live preview).

## Pipeline state — US-001 + US-003 (approved plan to implement against)

**SDM tasks (T0–T5), one micro-commit each:**
- T0 create `tasks/sprint.md` + mark stories In Progress
- T1 desktop header "Get a Free Quote" CTA
- T2 detail-page CTA band (found + not-found variants)
- T3 detail-page home links (both variants)
- T4 global 404 portfolio path
- T5 e2e additions + full gate (`npm test`, `tsc`, `eslint`, e2e on free ports)

**Architect constraints:**
- T1: `<Button href={resolveNavHref("#lead-form", pathname)}>Get a Free Quote</Button>` — variant `primary`, size `md`, `className="hidden md:inline-flex"`, placed after the nav `<ul>` in the desktop block (`Header.tsx` ~L118–138). Drawer CTA untouched.
- T2: band after `</article>` inside the `max-w-4xl` container; renders on BOTH the found and "Project Not Found" variants (AC3 + no-dead-ends). Detail page stays a server component (`resolveNavHref` is pure).
- T2b (in-scope correction): `scroll-mt-16` on the `#lead-form` section (`src/app/page.tsx:58`) so anchor landings clear the 64px sticky header. QA caveat: with the banner enabled, 16 may undershoot — verify visually.
- T4: global 404 (`app/not-found.tsx`) gains a portfolio path beside "Go back home", reusing existing link classes.
- Tests extend existing files: `tests/components/layout/Header.test.tsx`, `tests/app/portfolio/[slug]/page.test.tsx`, `tests/app/not-found.test.tsx`, `tests/e2e/navigation.spec.ts`. No new test files.
- Forbidden: no duplicated lead form on portfolio pages; no new CtaBand component (reuse `Button`); no US-002 work (separate story/commit); no client-component conversion; drawer CTA and Footer untouched.

## Git state

- Branch `main`, **44 commits ahead of `origin/main`, unpushed** (push requires explicit user approval; pushing to `main` triggers production deploy).
- Working tree clean at the latest `docs(memory)` commit (pipeline state + US-006 draft).

## Shipped this stretch (2026-09-12/13)

1. **Visitor nav fixes** — `src/lib/nav.ts` `resolveNavHref()` rewrites `#section` anchors to `/#section` off the home page; Header logo links home; Footer path-aware; logo uses `next/link`.
2. **Portfolio filters collapsed** — `ScopeFilterTabs`/`TagFilter` deleted; new `FilterMultiSelect` (two dropdowns, multi-select, Clear filters button that renders only when filters are active, inline with the "Our Work" heading, `align="right"` on the second dropdown so its panel stays on-screen).
3. **Lightbox overhauled** — enlarged obvious controls with hover-lit bar, focus trap + focus restore, `figure/figcaption` + `role="status"` counter, rich context panel (project link, scope badge, finish tags, captions with de-duplication), `LightboxSlide`/`LightboxProject` types exported from the modal.
4. **Portfolio page** — "← Back to Home" via optional `backLink` prop on `PortfolioSection`; homepage instance unaffected.
5. **Admin "Edit Home" fix** — `HomePage.get_home_for_site()`/`ensure_for_site()` helpers; `home/bootstrap.py` post_migrate hook (NOT a data migration — replacing a site root touches tables of every Page-subclass app + search index, which don't all exist mid-migration); `seed` creates the HomePage too; hook falls back to "Create Home" instead of `#`. Local DB now: `Home → Portfolio → 6 items`, site root = HomePage id 10, 3 services + featured links seeded.
6. **Docs** — README intent corrected (multi-page, `/portfolio` first-class); memory bank initialized; US-001…US-006 drafted.

## Next steps (in order)

1. **Gate 4 → Developer gate for US-001 + US-003** — implement T0–T5 per the approved constraints above.
2. **US-002** — sitewide phone visibility from SiteSettings (same header row; separate commit/story).
3. **US-006** — settings live preview (drafted; needs PO→Architect pass on the mechanism).
4. **US-004** — human mobile walkthrough of the full funnel; record found issues to backlog.
5. **US-005** — owner edit→preview→publish walkthrough (now covers settings preview via US-006).
6. Regenerate the e2e visual baseline (`tests/e2e/visual/`) — **only once portfolio data renders via the real backend**; regenerating against the broken mock wiring would bake in a wrong baseline.
7. Push when the user approves (production deploy trigger!).

## Open items parked with the user

- Push approval (deploys to prod on push).
- Analytics/instrumentation story as the natural follow-up after US-001/US-002.

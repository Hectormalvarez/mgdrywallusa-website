# System Patterns — MGDrywall USA

## Architecture

Headless Wagtail API ← Next.js App Router (SSR) → visitor; Nginx single origin; Cloudflare Tunnel edge; webhook-automated deploys from GitHub Actions on push to `main`.

```
Visitor → Nginx ─┬─ /            → Next.js (frontend:3000)
                 ├─ /api/preview → Next.js
                 ├─ /admin/      → Django (backend:8000)
                 ├─ /api/        → Django (Wagtail APIRouter + DRF)
                 └─ /media/      → Django
```

## Page tree (Wagtail)

```
Root (id 1)
└── Home (HomePage — MUST be the default site's root page)
    └── Portfolio (PortfolioPage)
        └── PortfolioItem × N
```

**Site-root invariant:** the default site's root page must be a `HomePage`. Wagtail seeds fresh DBs with a stock "Welcome" page; `home/bootstrap.py` (post_migrate) and `seed` replace it via `HomePage.ensure_for_site()`, which repoints the site *before* deleting the old root (`Site.root_page` is CASCADE — deleting the pointed-at page deletes the site) and reparents children first (deleting a page removes its subtree).

## Cross-stack contract (binding — see `04-cross-stack-sync` rule)

- Content fields: explicit `APIField(...)` on the model ↔ matching TS type in `frontend/src/types/` ↔ `fields=` query in `src/lib/api.ts`. One-sided edits are bugs.
- Fetch layers never mix: SSR uses `WAGTAIL_API_BASE_URL` (Docker DNS) + `INTERNAL_FETCH_HEADERS` (`X-Forwarded-Proto: https`, survives Django's SSL redirect); browser uses relative `NEXT_PUBLIC_*` URLs via Nginx. All backend calls go through `src/lib/api.ts` — no ad-hoc `fetch` in components.
- Error contract: `{"errors": {field: [messages]}}` (wrapped by `core.exceptions.custom_exception_handler`). Frontend parses that shape.
- Validation parity: `frontend/src/features/leads/validation.ts` ↔ `backend/leads/serializers.py` must stay identical (regexes, limits, MIME types, tiers).
- Lead intake security: DRF throttle scope (`LeadRateThrottle`) + honeypot field (`company` → silent fake 201).
- Wagtail response quirks (e.g. hoisting `meta.slug`) normalize in `api.ts`, never in components.

## Preview machinery (verified 2026-09-13)

- **Pages:** wagtail-headless-preview → `/api/preview?content_type=…&token=…` → Next.js Draft Mode → page fetches draft fields via `PagePreviewAPIView` (token → draft page data). Home page only today (`ALLOWED_CONTENT_TYPES = ["home.homepage"]`).
- **SiteSettings has NO draft/preview path** — settings saves apply instantly to the live site, and page previews render chrome from the last *saved* settings. US-006 addresses this.

## Patterns in use

- **Navigation across pages:** `src/lib/nav.ts` `resolveNavHref(href, pathname)` — rewrites `#anchor` to `/#anchor` when not on `/`; used by Header + Footer.
- **CTA buttons in chrome** (header/footer/drawer): reuse `src/components/ui/Button.tsx` (`cva`, polymorphic — passing `href` renders an `<a>`). Labels are **intentionally hardcoded**; CMS-editable conversion copy lives in the HomePage hero fields and Site Settings.
- **Reusable filter UI:** `frontend/src/components/ui/FilterMultiSelect.tsx` — accessible multi-select (`aria-expanded`, real checkboxes, Escape/outside-click close); supports multi-select; `align` prop for panel anchoring.
- **Lightbox:** `LightboxModal.tsx` exports `LightboxSlide`/`LightboxProject`; presentational, focus-trapped.
- **Seeding/bootstrap:** idempotent `seed`/`seed_portfolio` commands + `home/bootstrap.py` post_migrate hook. Never data migrations for cross-app page-tree bootstrap (tables of other apps may not exist mid-migration; modelsearch signal handlers aren't disabled during migrations).
- **Admin customization:** `wagtail_hooks.py` per app (`@hooks.register`); menu pruning means sidebar items are sometimes the *only* route to an editor — sidebar links must never be dead (`#`) placeholders.

## Testing map

- Backend: `backend/tests/<app>/test_<module>.py`, factories in `tests/factories.py`, shared fixtures in `tests/conftest.py` (`root_page`, `home_page`, `site`, `test_image`, `portfolio_item`); `--reuse-db`; throttling disabled globally by autouse fixture.
- Frontend: `frontend/tests/` mirrors `src/` exactly; MSW handlers in `tests/mocks/handlers.ts` (add handlers for new endpoints, never stub fetch); jest-axe via `tests/utils/axe-helper.ts`; coverage thresholds 85 lines/statements, 80 branches/functions.
- E2E: `frontend/tests/e2e/` Playwright; **must run on free ports** (see techContext).

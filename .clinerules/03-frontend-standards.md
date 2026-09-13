---
paths:
  - "frontend/src/**"
  - "frontend/tests/**"
---
# Frontend Standards (Next.js / React / Tailwind)

## Structure

- `src/app/` — App Router routes and route handlers; `src/components/` — reusable UI grouped by domain (`layout/`, `sections/`, `portfolio/`, `ui/`, `forms/`); `src/features/` — feature logic (validation, constants, feature types); `src/lib/` — shared utilities and the API client; `src/types/` — shared type definitions.
- Tests mirror `src/` exactly under `tests/` (e.g. `src/components/ui/Button.tsx` ↔ `tests/components/ui/Button.test.tsx`). E2E specs live in `tests/e2e/` (Playwright; excluded from Jest).

## Components & Styling

- Tailwind 4 only. No other CSS framework; no inline `style` objects except for genuinely dynamic values.
- Variant-based components use `cva` + `cn()` (`@/lib/cn`) — follow `src/components/ui/Button.tsx`: cva base + variants, discriminated union for polymorphism (`<button>` vs `<a>`), `className` merged last via `cn`.
- Accessibility is mandatory, not optional: visible labels on inputs and filters, focus-visible outlines, adequate contrast, and full focus management for dialogs (trap focus inside, move focus in on open, restore to trigger on close — see `LightboxModal`).

## Data Fetching

- All backend calls go through the typed helpers in `src/lib/api.ts` — no ad-hoc `fetch` in components or pages.
- Server-side (SSR) fetches use `WAGTAIL_API_BASE` with `INTERNAL_FETCH_HEADERS` (`X-Forwarded-Proto: https`, required to survive Django's `SECURE_SSL_REDIRECT`); browser fetches use the relative `NEXT_PUBLIC_*` URLs through Nginx. Never mix the two URL layers.
- Server components must degrade gracefully when the backend is unreachable (settings fallback object, `null` page data). `fetchSiteSettings` is wrapped in `react.cache` for per-request deduplication — keep it that way.

## Testing

- Jest + Testing Library with ts-jest; API mocking via MSW (`tests/mocks/handlers.ts`). Add MSW handlers for new endpoints instead of stubbing `fetch`.
- Use the jest-axe helper (`tests/utils/axe-helper.ts`) for accessibility assertions on rendered components.
- Coverage thresholds are enforced (lines/statements 85, branches/functions 80) — do not merge code that drops coverage.
- Before committing: `cd frontend && npm test` and `npx tsc --noEmit`; lint with `npm run lint`.
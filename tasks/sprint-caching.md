# Sprint — Edge Caching (US-008)

**Story:** US-008 — The site is fast on every visit, and edits show up instantly (`docs/stories/US-008-edge-caching.md`)
**Pipeline:** UX ✓ (audit: `templates/ux-audit.md`) · PO ✓ · Human gate ✓ (2026-09-15 — purge in-scope, purge-everything v1, T1 expanded to discovery+baseline) · SDM ✓ · Architect ✓ (ADR-0002) · Human gate ✓ · **Developer ⬜** · QA ⬜ · Code Review ⬜

## Tasks

| ID | Task | AC | Depends on | Status |
|---|---|---|---|---|
| T1 | Cloudflare discovery + baseline — `scripts/cf-cache-stats.sh`: GraphQL cache-status breakdown, zone-settings audit, security-event volume; documents free-plan dataset limits; **baseline run before any caching change** | AC4 | none | ⬜ |
| T2 | Make published pages cacheable — remove `force-dynamic` ×3; guard `e2eScenarioHeaders` (prod no-op without `headers()`); `next: { revalidate: 300 }` on published fetches only; no custom HTML Cache-Control (Next owns it); fix `/media/`+`/static/` headers in `nginx/nginx.conf` → `public, max-age=86400` | AC1, AC5 | none | ⬜ |
| T3 | Publish → revalidate + edge purge — Wagtail `page_published`/`page_unpublished` signals → protected Next.js `/api/revalidate` (shared secret, 2s timeout, fire-and-forget) → `revalidatePath` ×3 + CF purge-everything; purge failure logs, never blocks publish | AC2 | T2 | ⬜ |
| T4 | Edge config + deploy purge — CF Cache Rule shaped by T1 findings (cache HTML respecting origin headers; bypass `/admin/*`, `/api/*`, preview) via scripted API call or documented click-path; best-effort purge appended to `scripts/deploy.sh` after health check | AC1, AC6 | T2 (T3 first) | ⬜ |
| T5 | Tests + full gate — Jest/MSW fetch/header tests, backend pytest for signals/webhook, `make check`; post-change CF stats re-run vs T1 baseline | AC4 | T1–T4 | ⬜ |

## Dependency map

T1 ∥ T2 → T3 → T4 → T5.

## Risks

| Risk | Mitigation |
|---|---|
| Stale HTML after publish if purge call fails | Bounded `s-maxage` (300s) always the fallback; purge failure logged, never blocks publish |
| CF token over-scoped or leaked | Zone-limited tokens (Analytics:Read + Zone Settings:Read; Cache Purge), `.env` only — never echoed/committed |
| Dev-stack headers misread as prod behavior | Verify via prod headers through the tunnel domain |
| Caching breaks draft/preview or lead flow | Explicit no-store tests; QA walks preview interactively |
| Deploys serving stale HTML | Best-effort purge in `deploy.sh` after health check (AC6) |

# Sprint — Flow Sign-off #1: Sitewide Conversion & Orientation

**Stories:** US-001 (Reach the business from anywhere) + US-003 (Never stuck off the main site) — shipped together, same surface.  
**Pipeline:** PO ✓ (US-001…006 drafts) · SDM ✓ · Architect ✓ · Human gate ✓ (2026-09-13) · **Developer: complete**

## Tasks

| ID | Task | Story | Status |
|---|---|---|---|
| T0 | Sprint file + story status updates | both | ✓ |
| T1 | Desktop header "Get a Free Quote" CTA (hidden < md; drawer owns mobile) | US-001 AC1–2 | ✓ |
| T2 | Detail-page CTA band after the article (found + not-found variants) | US-001 AC1–3 | ✓ |
| T2b | `scroll-mt-16` on `#lead-form` so anchor landings clear the sticky header | US-001 AC2 | ✓ |
| T3 | Home link beside "← Back to Portfolio" (both detail variants) | US-003 AC1 | ✓ |
| T4 | Global 404: portfolio path beside "Go back home" | US-003 AC2 | ✓ |
| T5 | E2E additions + full gate (jest --coverage, tsc, eslint, playwright free ports) | both | ✓ |

## QA gate

- Verify every AC in both story files; scroll-margin behaviour eyeballed (banner-enabled case).
- Then Code Review gate → close-out.

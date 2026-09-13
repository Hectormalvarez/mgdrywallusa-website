# Product Context — MGDrywall USA

## Visitor funnel (the money path)

| Step | Surface | Status |
|---|---|---|
| 1. Land → hero CTA → quote form | Home (CMS-driven copy) | ✅ Works |
| 2. Browse "Our Work" → filter by project type / finish | Home portfolio section | ✅ Works (two multi-select dropdowns + Clear, inline with the heading) |
| 3. Home → "View all projects" → listing | `/portfolio` | ✅ Works (filters + back-to-home link) |
| 4. Open a photo → understand what it is | Lightbox | ✅ Works (project name, scope, finish tags, captions, link into the project) |
| 5. Convinced → **contact** | From listing / project detail | ⚠️ **Weakest link** — no quote/call CTA in view; only the header jumping home. This is US-001 |
| 6. Project detail → way back | Detail page | ⚠️ Has "← Back to Portfolio", no home link (US-003) |
| 7. Just wants to call | Sitewide | ❓ Phone prominence unverified outside home (US-002) |
| 8. Whole funnel on a phone | Sitewide | ❓ Never walked by a human (US-004) |

**Business acceptance criteria for the funnel** (stories US-001…US-005 in `docs/stories/`):

1. From any page, the quote form or phone is reachable in one visible click.
2. Any project photo tells you what it shows and links to its project in one click. *(done)*
3. Any page can return home without the browser back button. *(done except project detail + 404)*
4. The owner can edit and publish content and see it live without a developer. *(admin side fixed 2026-09-13; end-to-end owner walkthrough pending — US-005)*

## Content-owner journey

Owner workflow: edit homepage/portfolio → preview draft → publish → see live. The admin is deliberately pruned to a focused business app ("Operations Hub": Leads, Portfolio, Site Settings, Edit Home) — the Pages explorer/images/documents menus are hidden on purpose, so sidebar shortcuts are the *only* route to some editors.

**2026-09-13 fix:** the "Edit Home" sidebar item was a dead `#` link whenever no HomePage existed (the case locally; production worked by accident). Now the local DB is rooted at a real HomePage, services seed, and the item can never be a dead link again (falls back to a create flow).

## Tone & audience notes

Trade-business audience: direct, trust-building, work-first. The portfolio is the trust engine — visitors want to see real finished work before calling. Copy decisions favour clarity over cleverness; photo captions and project scope labels matter more than design flourish.

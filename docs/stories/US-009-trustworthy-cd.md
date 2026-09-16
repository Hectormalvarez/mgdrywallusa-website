# US-009 — A deploy can never silently break the site

**Status:** Approved · **Priority:** 1 · **Depends on:** US-008 (deployed)

## Description

> **As the** business owner,
> **I want** every deployment to either succeed fully or announce itself loudly as failed,
> **so that** the website never goes down (or shows stale content) without me knowing within minutes, not days.

## Context & Scope

On 2026-09-15/16 the site was down for ~16 hours: a deploy killed its own runner
mid-swap (the compose `up` recreated the webhook container executing it, plus the
tunnel via dependent-recreation), leaving the tunnel/nginx stopped. GitHub showed a
green Release because the webhook daemon answers `200` before the deploy runs
("lying 200"), and no monitoring existed. Grounded in the CD review in
`tasks/sprint-caching.md` and the incident timeline below.

**In scope**
- Deploy success/failure is truthfully reflected in the GitHub Release job.
- App deploys can never stop or restart the tunnel/webhook containers.
- The public site is smoke-checked at the end of every deploy; failure fails the deploy.
- Health-check endpoints/headers are contract-tested in CI (no more deleted-endpoint drift).
- A server-side watchdog converges missing containers (defense-in-depth).

**Out of scope (backlog)**
- P3: moving deploy execution off the webhook container (host systemd/ssh runner).
- P4: digest-pinned image tags in the webhook payload.

## Acceptance Criteria

1. **Given** a deploy whose script fails at any step, **when** the Release job completes, **then** the job is marked failed (HTTP 200 + body `"status":"ok"` required — not just webhook liveness).
2. **Given** an app deploy (frontend/backend/nginx images), **when** the swap runs, **then** `cloudflared` and `webhook` containers are untouched — the deploy cannot kill itself (verified behavior: sequential `up -d --no-deps`).
3. **Given** a deploy finished swapping containers, **when** the public URL is requested, **then** a non-200 response fails the deploy (with retries to ride out edge cache MISS latency).
4. **Given** someone deletes the health endpoint or changes its required headers, **when** CI runs, **then** the health-contract test fails before merge (compose healthcheck, deploy.sh, and the Django URLconf must agree).
5. **Given** a container is missing/stopped on the server (any cause), **when** the watchdog runs (≤15 min), **then** the stack converges back to running, except while a deploy is in progress (lockfile).
6. **Edge:** **Given** the database-restore step, **when** a rollback happens, **then** the database is NOT auto-restored (data-loss hazard); restore remains a deliberate manual `scripts/restore.sh` action.
7. **Edge:** **Given** `backups/` is empty or missing, **when** a rollback runs, **then** it completes cleanly instead of aborting under `set -euo pipefail`.

## Incident record (2026-09-15 → 16)

- 19:33:54 webhook fired deploy for `cbde8df`; daemon answered 200 in 133µs (async).
- 19:34:07 `compose up -d` recreated nginx → dependents `cloudflared`+`webhook` recreated → runner killed ("caught terminated signal") → frontend left *Created*, nginx/tunnel/webhook left *Exited (0)* → 530 for ~16h (no watchdog; clean-exited containers are not auto-restarted by `unless-stopped`).
- Releases: `cbde8df` **green** (lying 200), `123d07e` **red** (webhook already dead) — both broken deploys.

## Audit trail

CD review + incident analysis 2026-09-16 (`tasks/sprint-cd.md`); approved P1+P2 scope,
P3/P4 backlog; amendments approved after live incident: sequential `--no-deps` swap
(upgraded from explicit service list) + server watchdog cron.

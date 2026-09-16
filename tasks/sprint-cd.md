# Sprint — Trustworthy CD (US-009)

**Status:** IN PROGRESS · Story: `docs/stories/US-009-trustworthy-cd.md`
**Pipeline:** PO ✓ · SDM ✓ · Architect ✓ · Human gate ✓ (2026-09-16, incl. post-incident amendments) · Developer ⬜ · QA ⬜ · Code Review ⬜

## Tasks

| ID | Task | AC | Status |
|---|---|---|---|
| T1 | Truthful webhook signal: `hooks.json` sync response, bridge status JSON + `.last-deploy.json`, Release body check + timeout | AC1 | ⬜ |
| T2 | Safe swap: sequential `up -d --no-deps` (db→backend→frontend→nginx) + rollback hardening (no auto-DB-restore, guarded `ls`, error trap, HEALTH_HOST in config block) | AC2, AC6, AC7 | ⬜ |
| T3 | Post-deploy external smoke check (public URL 200, retried) | AC3 | ⬜ |
| T4 | Health contract: `scripts/health.env` + `backend/tests/core/test_health_contract.py` (compose ↔ deploy.sh ↔ URLconf agree) | AC4 | ⬜ |
| T5 | Server watchdog: `scripts/watchdog.sh` + cron on usrv-01 with `.deploy-in-progress` lockfile | AC5 | ⬜ |
| T6 | Gates + incident doc + memory bank | — | ⬜ |

## Key decisions

- Sequential `--no-deps` swap (not explicit service list): `--no-deps` provably stops compose from recreating dependent containers (cloudflared/webhook) — the exact 2026-09-15 kill chain. Empirically verified in the dev stack before shipping (see QA section when done).
- Webhook truth: `include-command-output-in-response: true` makes the daemon hold the HTTP connection until the bridge exits; bridge always prints a final JSON status on stdout; Release requires HTTP 200 **and** `"status":"ok"` in the body (robust even if the daemon maps exit codes differently).
- Watchdog = idempotent `compose up -d` behind a lockfile; never races a live deploy.
- Backlog: P3 (runner isolation off the webhook container), P4 (digest pinning).

## QA evidence

_(filled at QA gate)_

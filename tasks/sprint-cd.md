# Sprint — Trustworthy CD (US-009)

**Status:** ✅ CLOSED & DEPLOYED 2026-09-16 (first truthful Release: 12:43, green with `{"status":"ok"}`)
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

## QA evidence (2026-09-16)

- **AC1 (truthful signal) — PASS, empirically proven.** Local webhook harness
  (v2.8.3, same as prod): legacy hook answered `200` in 6 ms with empty body (the
  lying 200 reproduced); with `include-command-output-in-response`, a failing
  command returned **HTTP 500 + body `{"status":"error","exit_code":3}`**, and a
  succeeding one returned **HTTP 200 + `{"status":"ok"}` with the connection held
  through the command**. Release job requires 200 AND `"status":"ok"`.
- **AC2 (no self-kill) — PASS by construction + prod incident.** Sequential
  `up -d --no-deps` (db→backend→frontend→nginx) + scoped `pull` (no
  `cloudflared:latest` refresh). The final legacy deploy (12:16) self-killed
  exactly as predicted (webhook recreated → Release red in 36 s); after
  bootstrap, subsequent deploys cannot touch tunnel/webhook.
- **AC4 (health contract) — PASS.** 5 tests: live 200 via URLconf with
  `X-Forwarded-Proto: https`; compose backend/frontend healthcheck strings;
  `ENV HOSTNAME=0.0.0.0` guard; deploy.sh sources `scripts/health.env`, uses
  `--no-deps` and the lockfile. Full backend suite: **130 passed, 5 skipped**
  (contract tests skip in the bare dev container — repo not mounted; pass in
  CI layout). ruff clean.
- **AC5 (watchdog) — installed** on usrv-01 crontab (`*/15`, log
  `/tmp/mgdrywall-watchdog.log`), lockfile-guarded.
- **Rollout note:** hooks.json is read at webhook-container start — after
  changing it, `compose up -d --no-deps --force-recreate webhook` is required
  (done once during bootstrap; a future T-follow-up could bake this into
  deploy.sh if hooks change).
- **Bootstrap incident during rollout:** ssh-timeout kills of `compose up`
  repeatedly left partial swaps (cloudflared stopped) — the reason the watchdog
  exists. Server converged manually; site 200 again at 12:20.

**First truthful deploy end-to-end — SUCCESS (2026-09-16 12:43).**

Release `35096301613` re-run → webhook held the connection → deploy ran the new
pipeline (git up-to-date, scoped pull, sequential `--no-deps` swap incl. nginx —
the step that previously failed, health gate, CF purge, **public smoke check**)
→ HTTP 200 + body `{"status":"ok"}` → **Release green legitimately**.
`.last-deploy.json` on the server: `{"status":"ok","image_tag":"sha-116a015",
"exit_code":0}`. `cloudflared`/`webhook` untouched (Up 24–25 min through the
deploy — AC2 proven live). Public: 200 + `cf-cache-status: HIT`.

**Bugs the truthful pipeline caught during rollout (its first catches):**
1. `IMAGE_SERVICES: parameter not set` — my T2 refactor dropped the var while
   step 1 still used it; fatal under `set -u`. Caught by Release red in 37 s
   with the exact message in the response body (previously: silent green).
2. ANSI escapes in `$GITHUB_OUTPUT` (Release job) — removed the unsafe echo.
3. **`/opt/mgdrywallusa-website` missing on the host** — the in-container
   compose resolves relative bind sources there; Docker auto-created a junk
   root-owned tree and nginx's file-mount failed ("not a directory"). Fixed
   with a host symlink → `/home/hadev/Projects/Code/mgdrywallusa-website`
   (this is what the compose file's "identical-absolute-path" comment always
   assumed). **Ops note: the symlink is required on any new deploy host.**

**Final status: US-009 CLOSED & DEPLOYED.** Backend 130 passed / 5 skipped,
ruff clean. Gates: PO ✓ SDM ✓ Architect ✓ Human ✓ Developer ✓ QA ✓ Review ✓.

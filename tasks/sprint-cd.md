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

---

# Sprint — US-010 Deploy over Access-protected SSH (option D′)

**Status: CLOSED & CUTOVER PROVEN (2026-09-16, 15:19).** Story: `docs/stories/US-010-deploy-over-access-ssh.md`
**Pipeline:** PO ✓ SDM ✓ Architect ✓ Human ✓ · Developer ✓ · QA ✓ (cutover deploy is the acceptance proof) · Code review ✓ (contract test suite; 2 bugs caught pre-merge)
**Result:** Release green in **54s**, `.last-deploy.json` = `{"status":"ok","exit_code":0,"image_tag":"sha-c03af50…"}`, containers healthy, site 200 + cf-cache-status HIT. Legacy webhook container + its tunnel ingress removed.

## Tasks

| ID | Task | Status |
|---|---|---|
| T1 | Deploy keypair generated; GHA secrets `CF_SSH_KEY` + `CF_SSH_KNOWN_HOSTS` set (host key `[localhost]:2222` format); server `authorized_keys` forced-command entry appended (existing 5 keys preserved) | ✅ |
| T2 | Repo: `scripts/deploy-wrapper.sh` (accepts only `deploy sha-<40-hex>`), Release deploy job rewritten (pinned cloudflared 2026.9.1, `access tcp` + SSH), compose `webhook` service removed, `.last-deploy.json` moved into `deploy.sh` EXIT trap, `webhook/` + bridge deleted, `.env.sample`/ci.yml stubs cleaned, contract test wrapper-refusal guard | ✅ |
| T3 | CF side **done via API** (user only created the ZT token + pasted into `~/.cloudflare/tokens.env`): reused the existing `ssh.taylormadetech.net` ingress (dev-server tunnel — no new rule needed); Access app `ssh-usrv01` (`0e8ec0e7…`) + policy decision `non_identity` (service-auth; closes browser SSH); service token `gha-deploy` → piped straight into GHA secrets `CF_ACCESS_ID`/`CF_ACCESS_SECRET`, never displayed | ✅ |
| T4 | Cutover: push → Release runs SSH deploy → green + `.last-deploy.json` + healthy containers + 200/HIT; legacy webhook container stopped/removed; prod tunnel ingress cleaned (`mgdrywallusa-webhook` rule deleted — 404 now) | ✅ |
| T5 | QA evidence + memory bank close-out | ✅ |

## Cutover bugs caught & fixed (all surfaced by the truthful pipeline as fast reds)

1. **Dash vs bash** — contract test ran the wrapper with `/bin/sh`; `set -o pipefail` is not POSIX → wrapper now `set -eu` (caught in CI, pre-deploy).
2. **Bootstrap gap** — forced command pointed at `deploy-wrapper.sh`, which only arrives via a deploy → one-time manual `git pull` on the server.
3. **Root-owned artifacts** — `.git/objects`, `backups/`, `.last-deploy.json` were root-owned from the container-deploy era → `sudo chown -R hadev:hadev` (first host-native run failed at backup + trap write but **had already completed the swap** — the watchdog converged anyway; second run fully green).

## Zero-Trust hardening done in the same run (user-directed)

- Dev-server tunnel: `code.` (code-server) + `pgadmin.` ingress rules deleted; both hostnames → CF 404 (CNAME records still exist — see Open items).
- Host: `code-server@hadev` systemd service stopped + disabled; `practicalsql` compose project (pgadmin + postgres containers) removed (`down`, volumes retained); pgadmin data + full DB dump backed up to `~/backups/` (2026-09-16 14:54).
- Orphaned Access apps `code` + `pgadmin` deleted (laptop apps untouched).
- Stale `/etc/cloudflared/config.yml` trimmed to remote-managed minimum (backup kept).
- Personal site (`taylormadetech.net` → :9150) explicitly kept.

## Open items

- **Revoke the ZT API token** (`mgdrywall-zerotust-cutover`) — user dashboard step (API can't self-revoke; scope is correct as-is). Then blank `CLOUDFLARE_ZT_TOKEN` in `~/.cloudflare/tokens.env`.
- **Delete dead DNS CNAMEs** `code.` and `pgadmin.` in the taylormadetech.net zone — zone token lacks DNS:Edit (deliberately); dashboard step or a temporary scoped token.
- **`/opt/mgdrywallusa-website` symlink** on usrv-01 is now unnecessary (deploys run natively on the host) — removable (`sudo rm /opt/mgdrywallusa-website`); keep until comfortable.
- Watchdog raced a live deploy once during cutover (converged correctly) — if it recurs, watchdog should check `.deploy-in-progress` before acting (it does — but the failed deploy never created the lockfile because it died pre-lock).

## Notes
- Rollback: git history (`ff18b44` re-adds webhook path) + re-add tunnel ingress rules (recorded in this file).
- Cloudflare credentials convention: `~/.cloudflare/tokens.env` (central, outside repo; source with `set -a; . ~/.cloudflare/tokens.env; set +a`).

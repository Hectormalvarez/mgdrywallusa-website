# US-012 — CD deploy route lives on the project's own tunnel

**Status:** Approved · **Priority:** 1 · **Depends on:** US-010 (deploy over Access SSH)

## Description

> **As the** business owner,
> **I want** the deploy edge route to live on this project's own Cloudflare tunnel,
> **so that** the project is fully enclosed — its CD path travels with it and never depends on host-level tunnel infrastructure shared with other apps.

## Context & Scope

US-010 (D′) moved deploys onto SSH that is reachable only through Cloudflare
Access, but the ingress was created dashboard-side on the **host-zone** tunnel
(`ssh.taylormadetech.net`, Access app `ssh-usrv01`, host service tokens). The
project's own tunnel (`mgdrywall-prod` cloudflared container,
`docker-compose.prod.yml`) serves only site + 404. That coupling means a clone
of this project inherits a deploy path pinned to *this host's* tunnel
namespace — a reproducibility gap flagged in
`docs/reviews/2026-09-20-launch-status-and-reproducibility.md`.

US-012 moves the edge route to the project tunnel. The three security gates
(edge service token, SSH key, forced-command wrapper) are unchanged; the
SSH daemon remains the host's (deploys must run natively on the host — the
whole point of D′). A fully self-contained alternative (SSHD sidecar in the
project stack) was rejected: it would need a docker socket + host mounts,
recreating the US-009 runner-container problems.

Cloudflare free-plan constraint: proxied hostnames may sit only one level
below the zone apex, and `mgdrywallusa.taylormadetech.net` already occupies
that level — so the deploy hostname is **parallel, not nested**:
`mgdrywall-ssh.taylormadetech.net`.

**In scope (repo):** `extra_hosts: host-gateway:host-gateway` on the prod
`cloudflared` service (so the tunnel container can reach the host sshd);
`release.yml` reads the deploy SSH hostname from `vars.DEPLOY_SSH_HOSTNAME`
(fail fast when unset); contract-test guards; this story.

**Out of scope (user-side, dashboard):** adding the public hostname on the
project tunnel, the new project-scoped Access app + service tokens, GHA
secret/variable updates, deleting the old `ssh.taylormadetech.net` ingress +
`ssh-usrv01` Access app.

## Acceptance Criteria

1. **Given** the prod compose, **when** it comes up, **then** the cloudflared
   container can resolve `host-gateway` (extra_hosts present — CI-tested).
2. **Given** a push to `main` with green CI, **when** the Release deploy job
   runs, **then** it opens the Access tunnel on the *project* tunnel's deploy
   hostname read from `vars.DEPLOY_SSH_HOSTNAME`, and the job's exit code is
   the deploy outcome (unchanged from US-010).
3. **Given** `vars.DEPLOY_SSH_HOSTNAME` is unset, **when** the deploy job runs,
   **then** it fails fast with a clear remediation message (no partial state).
4. **Given** any future edit, **when** someone hardcodes a host-zone tunnel
   hostname into `release.yml`, **then** the contract test fails CI.
5. **Cutover:** the dashboard work (hostname + Access app + tokens) precedes
   the repo flip; one real deploy proves the new route before the old
   `ssh.taylormadetech.net` ingress and `ssh-usrv01` app are deleted.
   **DONE 2026-09-21** — see the cutover record below.

## Cutover record (executed 2026-09-21, via CF API + targeted prod recreate)

All dashboard steps were performed through the Cloudflare API with
`CLOUDFLARE_ZT_TOKEN` (`~/.cloudflare/tokens.env`); the prod host (`usrv-01`)
was reached over the LAN (`ssh usrv-01.lan`), not through the edge route.

| Item | Value |
|---|---|
| Deploy hostname | `mgdrywall-ssh.taylormadetech.net` (parallel to `mgdrywallusa…`, no nesting) |
| DNS | CNAME → `3a2fdaeb-1cf4-4ee9-99c7-12d9d8ca62b7.cfargotunnel.com`, proxied |
| Tunnel ingress | `mgdrywallusa-prod` now `[site → http://nginx:80, ssh → ssh://host-gateway:22, 404]` |
| Access app | `mgdrywallusa-deploy-ssh` = `f3e80fa4-821c-4594-b358-a0b78eb04841`, policy Service Auth (`non_identity`, include `everyone` — mirrors `ssh-usrv01`) |
| Service token | `mgdrywallusa-gha-deploy` = `6be54ea6-5b27-435c-9c2a-a83e18a46bec` |
| GH settings | variable `DEPLOY_SSH_HOSTNAME`; secrets `CF_ACCESS_ID`/`CF_ACCESS_SECRET` rotated to the new token |
| Prod recreate | one-time `docker compose up -d --no-deps cloudflared` (extra_hosts applied; other containers untouched) |
| Proof run | Release `35668628234` — **success**, deploy job 38 s, log shows `DEPLOY_SSH_HOSTNAME: mgdrywall-ssh.taylormadetech.net` |
| Proof facts | `.last-deploy.json` = `ok/exit 0/sha-06421ba…`; all three images `sha-06421ba…`; site `200` / `cf-cache-status: HIT` |

**Rollback snapshot:** pre-cutover tunnel config, Access app list, service token
list, DNS records and the cloudflared container spec were captured under
`/tmp/us012-rollback/` (dev box, ephemeral).

**Not deleted, on purpose:** `ssh.taylormadetech.net` + `ssh-usrv01` stay. The
host route is **shared**: `authorized_keys` entry 7 is another project's deploy
key (`gha-tmtn-deploy` → `tmtn_website/scripts/deploy…`), so deleting the route
or the Access app would break that project's CD. This project simply no longer
depends on it — enclosure achieved. Deleting remains an optional later
decision for the user.

## Lessons (2026-09-21)

1. **Deploys never recreate `cloudflared`** — and until this the watchdog
   silently did. `scripts/deploy.sh` swaps only `db/backend/frontend/nginx`
   (`--no-deps` each: the US-009 lesson). But the cron watchdog (`*/15`) ran a
   **blanket `compose up -d`**, which reconciles config drift — so a
   config-only change to cloudflared (like `extra_hosts`) landed within
   ≤15 minutes, at an arbitrary tick, with no signal, through the same
   "recreate a running container" mechanism that caused the 2026-09-15 outage.
   **Resolved 2026-09-26:** the watchdog converges *start-only*
   (`up -d --no-recreate`, and only while a service is not running), and
   `deploy.sh` Step 7b compares `compose config --hash <svc>` with the running
   container's `com.docker.compose.config-hash` label and **warns** with the
   exact remediation command. Config changes are now deliberate and visible —
   machine-checked in `backend/tests/core/test_health_contract.py`.
2. **Keep the prod checkout clean.** `deploy.sh` updates the host via
   `git pull --ff-only` (line 116) and treats failure as non-fatal. Copying
   files into the host checkout leaves it dirty → the pull is *silently
   skipped* while the deploy still succeeds. Prefer shipping files by push;
   if a file must be copied out-of-band, verify with
   `git diff --stat origin/main -- <file>` and restore with
   `git checkout -- <file>` afterwards.
3. **Edge posture: `include: everyone` is a documented misconfiguration.**
   As shipped, a no-token client reached the SSH banner on both the old and
   new route. Cloudflare lists "Include everyone" under *Common Access
   misconfigurations — anyone will be able to access your application*. The
   real gates were (and remain) the **SSH key** and, for CI, the **forced
   command**, but anonymous reach to port 22 was needless exposure.
   **Fixed 2026-09-26** — see the hardening batch below.

4. **A script change takes effect on the *next* deploy.** `deploy.sh` updates
   the host checkout in Step 3 while it is itself running; the shell keeps
   executing the already-open (old) file, so the revision that executes is the
   one from *before* the pull. Verify new deploy-time logic by looking for its
   output in the following deploy's log — the first run after a change proves
   nothing about the change itself (this is how the Step 7b gap was spotted:
   its output was missing from the deploy that shipped it).

## Follow-up hardening batch (2026-09-26)

**Access policy tightened.** `gha-deploy-service-auth` (policy
`513ad104-4445-4b92-a326-c3cb2d20df41`) no longer uses `include: everyone`; it
is scoped to the service token itself:

```json
{"decision": "non_identity",
 "include": [{"service_token": {"token_id": "6be54ea6-5b27-435c-9c2a-a83e18a46bec"}}]}
```

Verified: an anonymous client is now refused at the edge (`websocket: bad
handshake`), while the untouched `ssh.taylormadetech.net` route still answers
with the SSH banner (control). CI's continued access is proven by the deploy
that followed this change.

**Cleanup executed:** deleted the orphan `mgdrywallusa-webhook` CNAME (404, no
ingress, no Access app), deleted the dead `WEBHOOK_URL` / `WEBHOOK_TOKEN`
GitHub secrets (zero references in any workflow/script/code), removed the
stale webhook section from `.env.sample`, and reworded the retired-webhook
narrative in `deploy.sh`.

**Watchdog + drift visibility shipped:** `scripts/watchdog.sh` now converges
start-only; `deploy.sh` Step 7b reports config drift on never-recreated
services (`DRIFT_CHECK_SERVICES`, default `cloudflared`) as a warning with the
exact remediation command, and emits a GitHub annotation in CI.

**Left alone on purpose:** the shared `ssh-usrv01` app (the `tmtn_website`
deploy key lives on that route — tightening it would need both tokens) and the
orphaned `dev-laptop-webserver` Access app (not this project's).

**Deferred:** revoking `CLOUDFLARE_ZT_TOKEN` — still in use while Cloudflare is
optimized across all sites.



## Audit trail

Origin: user review 2026-09-21 — "CD got tied to the ssh route on my host's
cloudflare tunnel; the project has its own tunnel and should be using that one
to keep the project enclosed." Plan approved ("yes"); hostname constraint
recorded ("don't use nested subdomains due to cloudflare limitations").

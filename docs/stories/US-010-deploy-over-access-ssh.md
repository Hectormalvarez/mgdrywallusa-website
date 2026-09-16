# US-010 — GitHub deploys over Cloudflare-Access-protected SSH

**Status:** Approved · **Priority:** 1 · **Depends on:** US-009 (truthful CD)

## Description

> **As the** business owner,
> **I want** deploys to run with the fewest moving parts and the strongest possible guards,
> **so that** the deployment path cannot break itself and nobody but GitHub's signed job can trigger one.

## Context & Scope

US-009 made deploys truthful but left the runner inside the `webhook` container
(P3 residual): path translation (the `/opt` symlink hazard), a Docker socket in
a container, and a self-recreate risk on compose changes. US-010 (option D′)
removes the runner container entirely: GitHub Actions runs `deploy.sh` natively
on usrv-01 over SSH that is reachable **only** through Cloudflare Access
(service-token auth at the edge) on the existing outbound-only tunnel. The
server-side `authorized_keys` entry carries a forced command, so the key can run
only `scripts/deploy-wrapper.sh`, which accepts exactly `deploy sha-<40-hex>`.

**In scope:** rewrite the Release deploy job (pinned `cloudflared access tcp` +
SSH); forced-command wrapper + server key; remove the webhook daemon
(compose service, `webhook/`, bridge); `.last-deploy.json` moves into
`deploy.sh`'s EXIT trap; contract-test guards for the wrapper.

**Out of scope:** CF Access app/tunnel ingress creation (dashboard, user-side);
P4 digest pinning; staging target.

## Acceptance Criteria

1. **Given** a push to `main` with green CI, **when** the Release deploy job runs, **then** it opens the Access tunnel, SSHes to usrv-01, runs the deploy, and the job's exit code reflects the deploy outcome (no HTTP contract).
2. **Given** the deploy SSH key, **when** any command other than `deploy sha-<40-hex>` is attempted, **then** it is refused with an error and nothing executes (CI-tested).
3. **Given** the webhook daemon, **when** US-010 lands, **then** the compose `webhook` service, `webhook/`, and the bridge are removed; deploys no longer depend on a runner container (E1–E5 entanglements deleted).
4. **Edge:** **Given** the Access tunnel fails to open, **when** the deploy job runs, **then** it fails fast with a clear error (15s probe, no partial state).
5. **Edge:** **Given** the server checkout, **when** a deploy runs natively on the host, **then** no `/opt` path translation is involved (the symlink becomes unnecessary; document before removal).

## Cutover (user-side, dashboard)

1. Tunnel → Public Hostname: add `ssh.taylormadetech.net` → `ssh://localhost:22`.
2. Zero Trust → Access → Applications → Self-hosted for that hostname, policy Action **Service Auth**; create the Service Token under Access → Service Auth → Tokens (secret shown once).
3. Set GHA secrets: `gh secret set CF_ACCESS_ID` / `gh secret set CF_ACCESS_SECRET` (CF_SSH_KEY + CF_SSH_KNOWN_HOSTS already set by the assistant).

## Audit trail

P3 exploration 2026-09-16 (options A–E; D′ selected for locality-of-truth and
three-gate security: edge service token + SSH key + forced command). Approved by
user ("do it").

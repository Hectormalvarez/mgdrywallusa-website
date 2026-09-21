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

## Cutover (user-side, dashboard)

1. Project tunnel (`mgdrywall-prod`) → Public Hostname: add
   `mgdrywall-ssh.taylormadetech.net` → `ssh://host-gateway:22`
   (requires the `extra_hosts` change to be live in the running compose first).
2. Zero Trust → Access → Applications → Self-hosted for that hostname,
   Action **Service Auth**; create new service tokens.
3. Repo settings: Variables → add `DEPLOY_SSH_HOSTNAME=mgdrywall-ssh.taylormadetech.net`;
   Secrets → set the new `CF_ACCESS_ID` / `CF_ACCESS_SECRET`.
4. Prove with one real deploy (push or workflow re-run).
5. Cleanup: delete `ssh.taylormadetech.net` public hostname from the host-zone
   tunnel and the `ssh-usrv01` Access app (folds into the open US-010
   Zero-Trust cleanup list).

## Audit trail

Origin: user review 2026-09-21 — "CD got tied to the ssh route on my host's
cloudflare tunnel; the project has its own tunnel and should be using that one
to keep the project enclosed." Plan approved ("yes"); hostname constraint
recorded ("don't use nested subdomains due to cloudflare limitations").

"""US-009 AC4: the deploy health-check contract must never drift.

The production health checks (compose + deploy.sh) depend on a specific
endpoint answering 200 with ``X-Forwarded-Proto: https``. US-007 deleted the
endpoint the compose healthcheck used, which stalled a whole deploy behind
rollback loops. These tests fail CI the moment a merged change breaks that
contract — instead of a production deploy discovering it.
"""

from pathlib import Path

import pytest
from django.test import Client


def _repo_root() -> Path:
    """Locate the repo checkout (exists in CI/host checkouts; the bare dev
    container only mounts /app, in which case these tests skip)."""
    for parent in [Path(__file__).resolve(), *Path(__file__).resolve().parents]:
        if (parent / "docker-compose.prod.yml").exists():
            return parent
    pytest.skip("full repo checkout not available in this environment")


def _read(rel_path: str) -> str:
    return (_repo_root() / rel_path).read_text()


def _health_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for line in _read("scripts/health.env").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
    return values


@pytest.mark.django_db
def test_health_path_answers_200_with_proto_header() -> None:
    """The exact request shape used by compose/deploy.sh must succeed."""
    path = _health_env()["HEALTHCHECK_PATH"]
    response = Client().get(path, HTTP_X_FORWARDED_PROTO="https")
    assert response.status_code == 200, (
        f"{path} must answer 200 with X-Forwarded-Proto: https — the compose "
        "healthcheck and deploy.sh health gate depend on it"
    )


def test_compose_backend_healthcheck_matches_contract() -> None:
    compose = _read("docker-compose.prod.yml")
    path = _health_env()["HEALTHCHECK_PATH"]
    assert path in compose, "compose backend healthcheck must use HEALTHCHECK_PATH"
    assert "X-Forwarded-Proto" in compose, (
        "compose backend healthcheck must send X-Forwarded-Proto (SECURE_SSL_REDIRECT)"
    )


def test_compose_frontend_healthcheck_present() -> None:
    compose = _read("docker-compose.prod.yml")
    assert "http://127.0.0.1:3000/" in compose


def test_frontend_dockerfile_binds_wildcard() -> None:
    """Next 16 standalone binds the container hostname unless HOSTNAME is set;
    without 0.0.0.0 the 127.0.0.1 healthcheck is refused (2026-09-15 outage)."""
    dockerfile = _read("frontend/Dockerfile.prod")
    assert "ENV HOSTNAME=0.0.0.0" in dockerfile


def test_deploy_sh_matches_contract() -> None:
    deploy = _read("scripts/deploy.sh")
    env = _health_env()
    assert "health.env" in deploy, "deploy.sh must source the contract file"
    assert env["HEALTHCHECK_PATH"] in deploy
    assert "X-Forwarded-Proto" in deploy
    assert "up -d --no-deps" in deploy, "swap must never churn dependent containers"
    assert ".deploy-in-progress" in deploy, "deploy must hold the watchdog lockfile"


def test_deploy_wrapper_refuses_everything_but_deploy() -> None:
    """US-010: the gha-deploy SSH key is a forced command — the wrapper must
    reject anything that is not exactly `deploy sha-<40-hex>`."""
    import os
    import subprocess

    wrapper = _repo_root() / "scripts" / "deploy-wrapper.sh"
    assert wrapper.exists(), "deploy wrapper is required (authorized_keys forced command)"
    for bad in [
        "",
        "ls -la",
        "deploy",
        "deploy sha-bad",
        "deploy sha-" + "g" * 40,
        "deploy " + "a" * 40,
        "deploy sha-" + "0" * 40 + "; rm -rf /",
    ]:
        env = {**os.environ, "SSH_ORIGINAL_COMMAND": bad}
        result = subprocess.run([str(wrapper)], env=env, capture_output=True, text=True, timeout=10)
        assert result.returncode != 0, f"wrapper must refuse: {bad!r}"
        assert '"status":"error"' in result.stdout, f"wrapper must explain refusal: {bad!r}"

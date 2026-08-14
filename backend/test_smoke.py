"""Trivial smoke test to prove pytest boots inside the Docker container."""


def test_smoke():
    assert 1 + 1 == 2

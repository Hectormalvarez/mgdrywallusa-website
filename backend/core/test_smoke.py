"""Smoke tests to verify Django boots and serves requests."""

import pytest
from django.test import Client


@pytest.mark.django_db
def test_root_endpoint():
    """Test that the root endpoint returns 200 OK."""
    client = Client()
    response = client.get("/")
    assert response.status_code == 200
    assert b"Django OK" in response.content

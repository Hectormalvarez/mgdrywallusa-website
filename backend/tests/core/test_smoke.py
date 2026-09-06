"""Smoke tests: Django boot, media serving, and preview URL validation."""

import pytest
from django.conf import settings
from django.test import Client

from core.settings import _validate_wagtail_preview_url


@pytest.mark.django_db
def test_root_endpoint():
    """Test that the root endpoint returns 200 OK."""
    client = Client()
    response = client.get("/")
    assert response.status_code == 200
    assert b"Django OK" in response.content


@pytest.mark.django_db
def test_media_serve_with_debug_false(tmp_path, monkeypatch):
    """Media URLs should return 200 even when DEBUG=False (production mode)."""
    from django.views.static import serve as static_serve

    import core.urls

    (tmp_path / "hello.txt").write_text("hello media")

    media_pattern = next(p for p in core.urls.urlpatterns if getattr(p, "callback", None) is static_serve)
    monkeypatch.setitem(media_pattern.default_args, "document_root", str(tmp_path))

    client = Client()
    response = client.get("/media/hello.txt")
    assert response.status_code == 200
    assert b"".join(response.streaming_content) == b"hello media"


def test_preview_url_validation_rejects_http_in_production():
    """Production preview URL must use HTTPS."""
    with pytest.raises(ValueError, match="HTTPS"):
        _validate_wagtail_preview_url("http://example.com/api/preview", debug=False)


def test_preview_url_validation_rejects_docker_hostnames():
    """Production preview URL must not contain internal Docker hostnames."""
    with pytest.raises(ValueError, match="non-public"):
        _validate_wagtail_preview_url("https://backend:8000/api/preview", debug=False)


def test_preview_url_validation_rejects_localhost():
    """Production preview URL must not use localhost."""
    with pytest.raises(ValueError, match="non-public"):
        _validate_wagtail_preview_url("https://localhost:3000/api/preview", debug=False)


def test_preview_url_validation_accepts_https_in_production():
    """A valid public HTTPS origin should pass validation."""
    _validate_wagtail_preview_url("https://mgdrywallusa.taylormadetech.net/api/preview", debug=False)


def test_preview_url_validation_allows_anything_in_debug():
    """Debug mode bypasses all validation so local dev works."""
    _validate_wagtail_preview_url("http://localhost:3000/api/preview", debug=True)
    _validate_wagtail_preview_url("http://backend:8000/api/preview", debug=True)


@pytest.mark.django_db
def test_preview_url_settings_are_well_formed():
    """The runtime WAGTAIL_HEADLESS_PREVIEW setting must be a non-empty string."""
    client_urls = settings.WAGTAIL_HEADLESS_PREVIEW["CLIENT_URLS"]
    assert "default" in client_urls
    assert isinstance(client_urls["default"], str)
    assert client_urls["default"].startswith("http")
    assert "/api/preview" in client_urls["default"]

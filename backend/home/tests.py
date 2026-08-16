"""Regression tests for media serving, headless preview, and site settings API."""

import pytest
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.test import Client

from core.settings import _validate_wagtail_preview_url


@pytest.mark.django_db
def test_media_serve_with_debug_false(tmp_path, monkeypatch):
    """Media URLs should return 200 even when DEBUG=False (production mode).

    Regression test for the static() helper issue where Django's ``static()``
    returns ``[]`` when DEBUG=False, breaking media file serving.
    """
    from django.views.static import serve as static_serve

    import core.urls

    # Write a test file into the temporary directory
    (tmp_path / "hello.txt").write_text("hello media")

    # Patch the media URL pattern's document_root to the temp directory.
    # core/urls.py evaluates ``settings.MEDIA_ROOT`` at import time, so
    # override_settings alone won't reach the already-bound static_serve view.
    media_pattern = next(
        p
        for p in core.urls.urlpatterns
        if getattr(p, "callback", None) is static_serve
    )
    monkeypatch.setitem(media_pattern.default_args, "document_root", str(tmp_path))

    client = Client()
    response = client.get("/media/hello.txt")
    assert response.status_code == 200
    assert b"".join(response.streaming_content) == b"hello media"


@pytest.mark.django_db
def test_preview_endpoint_token_flow():
    """Preview endpoint should return 200 with valid token, 404 with invalid."""
    from wagtail_headless_preview.models import PagePreview

    from home.models import HomePage

    content_type = ContentType.objects.get_for_model(HomePage)
    PagePreview.objects.create(
        token="preview-123",
        content_type=content_type,
        content_json='{"pk": 1, "content_type": "home.homepage", "title": "Draft"}',
    )

    client = Client()

    # Valid token → 200 with JSON data
    response = client.get("/api/v1/preview/preview-123/")
    assert response.status_code == 200

    # Invalid token → 404
    response = client.get("/api/v1/preview/invalid-token/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_site_settings_endpoint_contract(site):
    """Settings endpoint should return correct keys and formatted navigation."""
    from home.models import NavigationItem, SiteSettings

    # Configure settings for the site
    settings_obj = SiteSettings.for_site(site)
    settings_obj.site_name = "MG Drywall USA"
    settings_obj.primary_color = "#0A3161"
    settings_obj.accent_color = "#B31942"
    settings_obj.save()

    # Add navigation item
    NavigationItem.objects.create(
        setting=settings_obj,
        label="Services",
        url="#services",
    )

    client = Client()
    response = client.get("/api/v1/settings/")

    assert response.status_code == 200
    data = response.json()

    # Verify required keys exist
    assert "site_name" in data
    assert "primary_color" in data
    assert "accent_color" in data
    assert data["site_name"] == "MG Drywall USA"
    assert data["primary_color"] == "#0A3161"
    assert data["accent_color"] == "#B31942"

    # Verify navigation is formatted correctly (url → href remap)
    assert "nav" in data
    assert len(data["nav"]) == 1
    assert data["nav"][0] == {"label": "Services", "href": "#services"}


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
    # Should not raise
    _validate_wagtail_preview_url(
        "https://mgdrywallusa.taylormadetech.net/api/preview", debug=False
    )


def test_preview_url_validation_allows_anything_in_debug():
    """Debug mode bypasses all validation so local dev works."""
    # Should not raise
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


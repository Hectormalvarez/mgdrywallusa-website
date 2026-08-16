"""Regression tests for media serving, headless preview, and site settings API."""

import pytest
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.test import Client


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


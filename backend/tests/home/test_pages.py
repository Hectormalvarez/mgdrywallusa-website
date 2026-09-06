"""Tests for the HomePage preview endpoint."""

import pytest
from django.contrib.contenttypes.models import ContentType
from django.test import Client


@pytest.mark.django_db
def test_preview_endpoint_token_flow(home_page):
    """Preview endpoint should return a JSON object with draft data."""

    home_page.hero_heading = "Draft Heading"
    home_page.save()

    preview = home_page.create_page_preview()
    preview.save()

    client = Client()

    # Valid token -> 200 with JSON object
    response = client.get(f"/api/v1/preview/{preview.token}/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert data["hero_heading"] == "Draft Heading"

    # Invalid token -> 404
    response = client.get("/api/v1/preview/invalid-token/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_preview_rejects_non_homepage_token():
    """Preview endpoint should return 400 for a token tied to a non-HomePage."""
    import json

    from wagtail.models import Page
    from wagtail_headless_preview.models import PagePreview

    content_type = ContentType.objects.get_for_model(Page)
    PagePreview.objects.create(
        token="other-page-token",
        content_type=content_type,
        content_json=json.dumps({"pk": 999, "content_type": content_type.id, "title": "Not Home"}),
    )

    client = Client()
    response = client.get("/api/v1/preview/other-page-token/")
    assert response.status_code == 400
    assert response.json()["error"] == "Unsupported content type"


@pytest.mark.django_db
def test_preview_serializes_api_fields(home_page, test_image):
    """Preview response must match the published API contract for HomePage."""
    from home.models import HomePageFeaturedService, Service

    home_page.hero_heading = "API Contract Test"
    home_page.hero_image = test_image
    home_page.save()

    service = Service.objects.create(
        name="Taping",
        slug="taping",
        short_description="Professional taping service.",
        icon="wall",
        is_active=True,
    )
    HomePageFeaturedService.objects.create(
        page=home_page,
        service=service,
        sort_order=0,
    )

    preview = home_page.create_page_preview()
    preview.save()

    client = Client()
    response = client.get(f"/api/v1/preview/{preview.token}/")
    assert response.status_code == 200
    data = response.json()

    # Hero fields
    assert data["hero_heading"] == "API Contract Test"
    assert "url" in data["hero_image"]
    assert "width" in data["hero_image"]
    assert "height" in data["hero_image"]
    assert "alt" in data["hero_image"]

    # Featured services list shape
    assert isinstance(data["featured_services"], list)
    assert len(data["featured_services"]) == 1
    assert data["featured_services"][0] == {
        "name": "Taping",
        "slug": "taping",
        "short_description": "Professional taping service.",
        "icon": "wall",
    }

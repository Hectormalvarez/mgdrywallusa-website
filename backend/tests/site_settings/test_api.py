"""Tests for the site settings API endpoint."""

import pytest
from django.test import Client


@pytest.mark.django_db
def test_site_settings_endpoint_contract(site):
    """Settings endpoint should return correct keys and formatted navigation."""
    from site_settings.models import NavigationItem, SiteSettings

    settings_obj = SiteSettings.for_site(site)
    settings_obj.site_name = "MG Drywall USA"
    settings_obj.primary_color = "#0A3161"
    settings_obj.accent_color = "#B31942"
    settings_obj.save()

    NavigationItem.objects.create(
        setting=settings_obj,
        label="Services",
        url="#services",
    )

    client = Client()
    response = client.get("/api/v1/settings/")

    assert response.status_code == 200
    data = response.json()

    assert "site_name" in data
    assert "primary_color" in data
    assert "accent_color" in data
    assert data["site_name"] == "MG Drywall USA"
    assert data["primary_color"] == "#0A3161"
    assert data["accent_color"] == "#B31942"

    assert "nav" in data
    assert len(data["nav"]) == 1
    assert data["nav"][0] == {"label": "Services", "href": "#services"}

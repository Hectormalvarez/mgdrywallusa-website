"""Tests for the site settings API endpoint (operational config, US-007)."""

import pytest
from django.test import Client


@pytest.mark.django_db
def test_site_settings_endpoint_contract(site):
    """Settings endpoint should expose only operational configuration.

    Visitor-facing chrome moved to the homepage API (US-007); this endpoint
    serves back-office values (lead alerts, auto-responder) only.
    """
    from site_settings.models import SiteSettings

    settings_obj = SiteSettings.for_site(site)
    settings_obj.notification_emails = "alerts@example.com"
    settings_obj.auto_responder_subject = "Got your request"
    settings_obj.save()

    client = Client()
    response = client.get("/api/v1/settings/")

    assert response.status_code == 200
    data = response.json()

    assert data["notification_emails"] == "alerts@example.com"
    assert data["auto_responder_subject"] == "Got your request"
    assert "auto_responder_message" in data

    # Chrome keys must NOT be served here anymore — they live on the homepage.
    for removed_key in ("site_name", "primary_color", "nav", "seo", "phone_number"):
        assert removed_key not in data

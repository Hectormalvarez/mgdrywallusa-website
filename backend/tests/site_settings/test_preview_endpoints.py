"""Tests for the Site Settings live-preview endpoints (US-006)."""

import pytest
from django.test import Client

pytestmark = pytest.mark.django_db


def _form_data(live):
    """Multipart payload matching the settings edit form, with edits applied."""
    return {
        "site_name": "PREVIEW-TEST NAME",
        "tagline": live.tagline,
        "phone_number": "+1-999-PREVIEW",
        "contact_email": live.contact_email,
        "license_number": "",
        "notification_emails": live.notification_emails,
        "auto_responder_subject": live.auto_responder_subject,
        "auto_responder_message": live.auto_responder_message,
        "primary_color": live.primary_color,
        "accent_color": live.accent_color,
        "banner_enabled": "on",
        "banner_text": "Preview banner",
        "banner_link": "#lead-form",
        "address_locality": live.address_locality,
        "address_region": live.address_region,
        "postal_code": live.postal_code,
        "country": live.country,
        "price_range": live.price_range,
        "navigation_items-TOTAL_FORMS": "2",
        "navigation_items-INITIAL_FORMS": "0",
        "navigation_items-MIN_NUM_FORMS": "0",
        "navigation_items-MAX_NUM_FORMS": "1000",
        "navigation_items-0-label": "Services",
        "navigation_items-0-url": "#services",
        "navigation_items-0-sort_order": "0",
        "navigation_items-0-id": "",
        "navigation_items-1-label": "Our Work",
        "navigation_items-1-url": "#portfolio",
        "navigation_items-1-sort_order": "1",
        "navigation_items-1-id": "",
    }


def _live_state():
    from wagtail.models import Site

    from site_settings.models import NavigationItem, SiteSettings

    site = Site.objects.filter(is_default_site=True).first()
    live = SiteSettings.for_site(site)
    return site, live, NavigationItem.objects.count()


def test_preview_roundtrip_serializes_unsaved_values(admin_client, site):
    from site_settings.models import SiteSettings

    live = SiteSettings.for_site(site)
    response = admin_client.post("/admin/settings-preview/", _form_data(live))

    assert response.status_code == 200
    url = response.json()["url"]
    assert "settings_token=" in url

    token = url.split("settings_token=")[1]
    fetch = Client().get(f"/api/v1/settings-preview/{token}/")
    assert fetch.status_code == 200
    data = fetch.json()

    # Unsaved edits win over the stored values.
    assert data["site_name"] == "PREVIEW-TEST NAME"
    assert data["phone_number"] == "+1-999-PREVIEW"
    assert data["banner_enabled"] is True
    assert data["banner_text"] == "Preview banner"
    # Nav rows are *unsaved* in-memory children — the fiddliest part of T2.
    assert data["nav"] == [
        {"label": "Services", "href": "#services"},
        {"label": "Our Work", "href": "#portfolio"},
    ]


def test_previewing_has_no_side_effects(admin_client, site):
    from site_settings.models import NavigationItem, SiteSettings

    site_obj, live, nav_count_before = _live_state()
    name_before, phone_before = live.site_name, live.phone_number

    response = admin_client.post("/admin/settings-preview/", _form_data(live))
    assert response.status_code == 200

    live_fresh = SiteSettings.for_site(site_obj)
    assert live_fresh.pk == live.pk
    assert live_fresh.site_name == name_before
    assert live_fresh.phone_number == phone_before
    assert NavigationItem.objects.count() == nav_count_before


def test_invalid_preview_token_returns_404(site):
    client = Client()
    response = client.get("/api/v1/settings-preview/not-a-real-token/")
    assert response.status_code == 404


def test_create_endpoint_requires_authentication(site):
    from site_settings.models import SiteSettings

    live = SiteSettings.for_site(site)
    response = Client().post("/admin/settings-preview/", _form_data(live))
    assert response.status_code in (302, 403)


def test_invalid_form_values_are_rejected_with_errors(admin_client, site):
    from site_settings.models import SiteSettings

    live = SiteSettings.for_site(site)
    data = _form_data(live)
    data["primary_color"] = "not-a-color"
    response = admin_client.post("/admin/settings-preview/", data)
    assert response.status_code == 400
    assert "primary_color" in response.json()["errors"]

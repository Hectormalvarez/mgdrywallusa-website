"""Tests for the transient SettingsPreview store (US-006)."""

from datetime import timedelta

import pytest
from django.utils import timezone

from site_settings.models import SettingsPreview

pytestmark = pytest.mark.django_db


def test_store_creates_unguessable_token(site):
    preview = SettingsPreview.store(site, {"site_name": "Preview Co"})
    assert len(preview.token) == 32
    assert preview.payload == {"site_name": "Preview Co"}
    assert preview.site == site


def test_get_valid_roundtrips_the_payload(site):
    preview = SettingsPreview.store(site, {"site_name": "Preview Co"})
    loaded = SettingsPreview.get_valid(preview.token)
    assert loaded is not None
    assert loaded.payload["site_name"] == "Preview Co"


def test_get_valid_returns_none_for_unknown_token(site):
    assert SettingsPreview.get_valid("does-not-exist") is None


def test_expired_previews_are_rejected(site):
    preview = SettingsPreview.store(site, {})
    SettingsPreview.objects.filter(pk=preview.pk).update(
        created_at=timezone.now() - timedelta(hours=SettingsPreview.TTL_HOURS + 1)
    )
    assert SettingsPreview.get_valid(preview.token) is None


def test_store_prunes_stale_previews(site):
    stale = SettingsPreview.store(site, {})
    SettingsPreview.objects.filter(pk=stale.pk).update(
        created_at=timezone.now() - timedelta(hours=SettingsPreview.TTL_HOURS + 1)
    )
    SettingsPreview.store(site, {})
    assert SettingsPreview.objects.count() == 1


def test_previews_never_touch_live_settings(site):
    from site_settings.models import SiteSettings

    live = SiteSettings.for_site(site)
    before = live.site_name
    SettingsPreview.store(site, {"site_name": "Drastically Different"})
    assert SiteSettings.for_site(site).site_name == before

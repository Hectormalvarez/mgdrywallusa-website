"""Tests for the post_migrate site bootstrap.

``ensure_site_homepage`` runs at the end of every ``migrate``, which the
container entrypoint and CI both invoke, so these guard the behaviour that
keeps a fresh database usable.
"""

import logging

import pytest
from wagtail.models import Page, Site

from home.bootstrap import ensure_site_homepage
from home.models import HomePage


@pytest.mark.django_db
def test_bootstrap_is_a_noop_when_homepage_exists(home_page, site):
    """Running on a populated database must not create a second HomePage."""
    ensure_site_homepage(sender=None)

    assert HomePage.objects.count() == 1
    assert HomePage.objects.first().pk == home_page.pk
    assert Site.objects.get().root_page_id == home_page.pk


@pytest.mark.django_db
def test_bootstrap_creates_homepage_for_site_rooted_at_plain_page(root_page):
    """A site rooted at a non-HomePage gets replaced by a real HomePage."""
    HomePage.objects.all().delete()  # CASCADE also drops the default site

    stale = Page(title="Welcome to your new Wagtail site!", slug="home", live=True)
    root_page.add_child(instance=stale)
    Site.objects.create(hostname="localhost", port=80, root_page=stale, is_default_site=True)

    ensure_site_homepage(sender=None)

    assert HomePage.objects.count() == 1
    assert isinstance(Site.objects.get().root_page.specific, HomePage)


@pytest.mark.django_db
def test_bootstrap_never_raises(monkeypatch, caplog):
    """A bootstrap convenience must not be able to break `manage.py migrate`."""
    HomePage.objects.all().delete()  # so the handler reaches ensure_for_site

    def explode(site=None):
        raise RuntimeError("boom")

    monkeypatch.setattr(HomePage, "ensure_for_site", explode)

    with caplog.at_level(logging.WARNING):
        ensure_site_homepage(sender=None)  # must not raise

    assert "Could not ensure a HomePage" in caplog.text

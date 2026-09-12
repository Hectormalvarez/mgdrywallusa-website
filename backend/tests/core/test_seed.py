"""Tests for the seed management command's HomePage bootstrap."""

import pytest
from django.core.management import call_command
from wagtail.models import Page, Site

from home.models import HomePage


def _simulate_fresh_database(root_page):
    """Rebuild Wagtail's out-of-the-box page tree.

    A freshly migrated database has the default site rooted at a plain
    "Welcome to your new Wagtail site!" page and no HomePage anywhere. The
    post_migrate bootstrap normally replaces that page, so this restores the
    pre-bootstrap state to exercise it explicitly.

    Deleting the HomePage also removes the default site, because
    ``Site.root_page`` is an ON DELETE CASCADE foreign key.
    """
    HomePage.objects.all().delete()

    stale = Page(title="Welcome to your new Wagtail site!", slug="home", live=True)
    root_page.add_child(instance=stale)
    Site.objects.create(hostname="localhost", port=80, root_page=stale, is_default_site=True)
    return stale


@pytest.mark.django_db
def test_seed_creates_homepage_when_missing(root_page):
    """seed should root the site at a HomePage when the database has none."""
    _simulate_fresh_database(root_page)

    call_command("seed")

    assert HomePage.objects.count() == 1
    assert isinstance(Site.objects.get().root_page.specific, HomePage)


@pytest.mark.django_db
def test_seed_replaces_the_stock_welcome_page(root_page):
    """The placeholder page must be gone, not merely orphaned."""
    stale = _simulate_fresh_database(root_page)

    call_command("seed")

    assert not Page.objects.filter(pk=stale.pk).exists()


@pytest.mark.django_db
def test_seed_preserves_existing_child_pages(root_page):
    """Pages under the replaced root keep their slug and live status."""
    stale = _simulate_fresh_database(root_page)
    child = Page(title="Portfolio", slug="portfolio", live=True)
    stale.add_child(instance=child)

    call_command("seed")

    child.refresh_from_db()
    assert child.slug == "portfolio"
    assert child.live is True
    assert isinstance(child.get_parent().specific, HomePage)


@pytest.mark.django_db
def test_seed_does_not_duplicate_homepage(home_page, site):
    """An existing HomePage must survive repeated seeding."""
    call_command("seed")
    call_command("seed")

    assert HomePage.objects.count() == 1
    assert HomePage.objects.first().pk == home_page.pk

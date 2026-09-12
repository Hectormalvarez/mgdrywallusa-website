"""Tests for the HomePage site-integration helpers."""

import pytest
from wagtail.models import Page, Site

from home.models import HomePage
from portfolio.models import PortfolioPage


@pytest.mark.django_db
def test_fresh_database_is_rooted_at_a_homepage():
    """The post_migrate bootstrap must leave the default site rooted at a HomePage.

    Without this the admin's "Edit Home" shortcut has nothing to link to and
    the homepage content API returns an empty list.
    """
    site = Site.objects.get(is_default_site=True)
    assert isinstance(site.root_page.specific, HomePage)
    assert HomePage.objects.count() == 1


@pytest.mark.django_db
def test_get_home_for_site_resolves_the_site_root(home_page, site):
    """The helper should return the HomePage the site is rooted at."""
    assert HomePage.get_home_for_site() == home_page


@pytest.mark.django_db
def test_get_home_for_site_returns_none_when_absent(home_page, site):
    """No HomePage anywhere means no resolvable homepage."""
    HomePage.objects.all().delete()

    assert HomePage.get_home_for_site() is None


@pytest.mark.django_db
def test_ensure_for_site_is_idempotent(home_page, site):
    """An existing HomePage must be returned untouched."""
    assert HomePage.ensure_for_site() == home_page
    assert HomePage.objects.count() == 1


@pytest.mark.django_db
def test_ensure_for_site_replaces_stock_root_and_preserves_children(root_page):
    """Replacing the stock welcome page must repoint the site and keep children.

    A naive delete of the site root would take the PortfolioPage subtree with
    it, and Site.root_page is CASCADE, so the site must be repointed first.
    """
    HomePage.objects.all().delete()

    stock = Page(title="Welcome to your new Wagtail site!", slug="welcome", live=True)
    root_page.add_child(instance=stock)
    child = PortfolioPage(title="Portfolio", slug="portfolio", live=True)
    stock.add_child(instance=child)
    portal = Site.objects.create(hostname="portal.test", root_page=stock, is_default_site=False)

    assert HomePage.get_home_for_site(portal) is None

    home = HomePage.ensure_for_site(portal)

    assert isinstance(home, HomePage)
    assert home.get_parent().pk == root_page.pk
    # Inherits the replaced root's slug so URLs keep working.
    assert home.slug == "welcome"

    # Children are reparented, not deleted.
    child.refresh_from_db()
    assert child.get_parent().pk == home.pk

    # The site now points at the HomePage, and the stock page is gone.
    portal.refresh_from_db()
    assert portal.root_page_id == home.pk
    assert not Page.objects.filter(pk=stock.pk).exists()

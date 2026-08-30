"""Tests for the seed_portfolio management command."""

import pytest
from django.core.management import call_command

from portfolio.models import PortfolioItem, PortfolioPage


@pytest.mark.django_db
def test_seed_creates_six_items(home_page, site):
    """seed_portfolio should create exactly 6 portfolio items."""
    call_command("seed_portfolio")
    assert PortfolioItem.objects.count() == 6


@pytest.mark.django_db
def test_seed_creates_portfolio_page(home_page, site):
    """seed_portfolio should create a root PortfolioPage if missing."""
    assert PortfolioPage.objects.count() == 0
    call_command("seed_portfolio")
    assert PortfolioPage.objects.count() == 1


@pytest.mark.django_db
def test_seed_is_idempotent(home_page, site):
    """Running seed_portfolio twice should not create duplicate items."""
    call_command("seed_portfolio")
    count_first = PortfolioItem.objects.count()
    call_command("seed_portfolio")
    count_second = PortfolioItem.objects.count()
    assert count_first == count_second == 6


@pytest.mark.django_db
def test_seed_clear_flag(home_page, site):
    """--clear should remove all items before re-seeding."""
    call_command("seed_portfolio")
    assert PortfolioItem.objects.count() == 6
    call_command("seed_portfolio", clear=True)
    # Should have re-created them
    assert PortfolioItem.objects.count() == 6


@pytest.mark.django_db
def test_seed_items_have_scopes(home_page, site):
    """Seeded items should cover all three scopes."""
    call_command("seed_portfolio")
    scopes = set(PortfolioItem.objects.values_list("scope", flat=True))
    assert "residential" in scopes
    assert "commercial" in scopes
    assert "adu_renovation" in scopes


@pytest.mark.django_db
def test_seed_items_have_tags(home_page, site):
    """Seeded items should have finish tags."""
    call_command("seed_portfolio")
    for item in PortfolioItem.objects.all():
        tags = [t.name for t in item.finish_tags.all()]
        assert len(tags) >= 1, f'"{item.title}" has no tags'


@pytest.mark.django_db
def test_seed_items_have_featured_images(home_page, site):
    """Seeded items should all have a featured image."""
    call_command("seed_portfolio")
    for item in PortfolioItem.objects.all():
        assert item.featured_image is not None, f'"{item.title}" has no featured image'


@pytest.mark.django_db
def test_seed_items_have_gallery_images(home_page, site):
    """Seeded items should each have 2 gallery images."""
    call_command("seed_portfolio")
    for item in PortfolioItem.objects.all():
        assert item.gallery_images.count() == 2, (
            f'"{item.title}" has {item.gallery_images.count()} gallery images, expected 2'
        )


@pytest.mark.django_db
def test_seed_items_are_child_of_portfolio_page(home_page, site):
    """All seeded items should be children of the PortfolioPage."""
    call_command("seed_portfolio")
    portfolio_page = PortfolioPage.objects.first()
    for item in PortfolioItem.objects.all():
        assert item.get_parent().pk == portfolio_page.pk

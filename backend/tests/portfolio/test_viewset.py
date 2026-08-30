"""Tests for the PortfolioItem admin viewset."""

import pytest
from django.test import Client
from wagtail.models import Page

from portfolio.admin import PortfolioItemViewSet, portfolio_item_viewset
from portfolio.models import PortfolioItem, PortfolioPage
from portfolio.tables import ImageThumbnailColumn


# ── Viewset Configuration ────────────────────────────────────────────────


def test_viewset_model():
    """ViewSet should target PortfolioItem."""
    assert portfolio_item_viewset.model is PortfolioItem


def test_viewset_icon():
    """ViewSet should use the image icon."""
    assert portfolio_item_viewset.icon == "image"


def test_viewset_list_filter():
    """ViewSet should filter by scope and live status."""
    assert "scope" in portfolio_item_viewset.list_filter
    assert "live" in portfolio_item_viewset.list_filter


def test_viewset_search_fields():
    """ViewSet should search title and description."""
    assert "title" in portfolio_item_viewset.search_fields
    assert "description" in portfolio_item_viewset.search_fields


def test_viewset_columns_include_thumbnail():
    """ViewSet columns should include ImageThumbnailColumn."""
    col_types = [type(c) for c in portfolio_item_viewset.columns]
    assert ImageThumbnailColumn in col_types


# ── Auto-parent resolution ───────────────────────────────────────────────


@pytest.mark.django_db
def test_get_creation_parent_page(home_page, site):
    """get_creation_parent_page should return the first PortfolioPage."""
    from portfolio.admin import PortfolioItemViewSet

    portfolio_page = PortfolioPage(title="Portfolio", slug="portfolio")
    home_page.add_child(instance=portfolio_page)

    viewset = PortfolioItemViewSet("portfolio_items")
    parent = viewset.get_creation_parent_page()
    assert parent is not None
    assert parent.pk == portfolio_page.pk


@pytest.mark.django_db
def test_get_creation_parent_page_returns_first():
    """get_creation_parent_page should return PortfolioPage.objects.first()."""
    from portfolio.admin import PortfolioItemViewSet

    viewset = PortfolioItemViewSet("portfolio_items")
    result = viewset.get_creation_parent_page()
    # Should not raise even when no PortfolioPage exists
    assert result is None or isinstance(result, PortfolioPage)

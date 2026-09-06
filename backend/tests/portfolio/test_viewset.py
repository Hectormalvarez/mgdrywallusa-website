"""Tests for the PortfolioItem admin viewset."""

from portfolio.admin import portfolio_item_viewset
from portfolio.models import PortfolioItem
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

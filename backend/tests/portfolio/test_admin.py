"""Tests for PortfolioItem admin panel organization.

Verifies content_panels are grouped into logical MultiFieldPanel sections
so editors see organized, contextual field groups instead of a flat list.
"""

import pytest
from wagtail.admin.panels import MultiFieldPanel

from portfolio.models import PortfolioItem


def _get_panel_headings(panels):
    """Extract headings from MultiFieldPanel instances in a panel list."""
    return [p.heading for p in panels if isinstance(p, MultiFieldPanel)]


def test_portfolio_item_panels_are_grouped():
    """PortfolioItem content_panels must use MultiFieldPanel groups, not flat fields."""
    headings = _get_panel_headings(PortfolioItem.content_panels)
    assert len(headings) >= 3, (
        f"Expected at least 3 panel groups, got {len(headings)}: {headings}"
    )


def test_portfolio_item_has_project_details_group():
    """There must be a 'Project Details' panel group containing scope and description."""
    headings = _get_panel_headings(PortfolioItem.content_panels)
    assert any("project" in h.lower() for h in headings), (
        f"Missing 'Project Details' group. Found: {headings}"
    )


def test_portfolio_item_has_images_group():
    """There must be an 'Images' panel group containing featured image and gallery."""
    headings = _get_panel_headings(PortfolioItem.content_panels)
    assert any("image" in h.lower() for h in headings), (
        f"Missing 'Images' group. Found: {headings}"
    )


def test_portfolio_item_has_tags_group():
    """There must be a 'Tags' panel group containing finish tags."""
    headings = _get_panel_headings(PortfolioItem.content_panels)
    assert any("tag" in h.lower() for h in headings), (
        f"Missing 'Tags' group. Found: {headings}"
    )


@pytest.mark.django_db
def test_register_portfolio_viewset():
    """Portfolio viewset hook should return a PortfolioItemViewSet instance."""
    from portfolio.admin import PortfolioItemViewSet
    from portfolio.wagtail_hooks import register_portfolio_viewset

    viewset = register_portfolio_viewset()
    assert isinstance(viewset, PortfolioItemViewSet)
    assert viewset.model.__name__ == "PortfolioItem"
    assert viewset.icon == "image"


def test_portfolio_viewset_has_thumbnail_column():
    """PortfolioItemViewSet should include an ImageThumbnailColumn."""
    from portfolio.admin import portfolio_item_viewset
    from portfolio.tables import ImageThumbnailColumn

    col_types = [type(c) for c in portfolio_item_viewset.columns]
    assert ImageThumbnailColumn in col_types


def test_portfolio_viewset_filters():
    """PortfolioItemViewSet should filter by scope and live status."""
    from portfolio.admin import portfolio_item_viewset

    assert "scope" in portfolio_item_viewset.list_filter
    assert "live" in portfolio_item_viewset.list_filter

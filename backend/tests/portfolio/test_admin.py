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

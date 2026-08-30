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
def test_register_portfolio_menu_item(home_page, site):
    """Portfolio menu hook should return a MenuItem linking to the page explorer."""
    from portfolio.models import PortfolioPage
    from portfolio.wagtail_hooks import register_portfolio_menu_item

    # Create a PortfolioPage so the hook can find it
    portfolio_page = PortfolioPage(title="Portfolio", slug="portfolio")
    home_page.add_child(instance=portfolio_page)

    menu_item = register_portfolio_menu_item()
    assert menu_item.label == "Portfolio"
    assert menu_item.icon_name == "image"
    assert str(portfolio_page.id) in menu_item.url


@pytest.mark.django_db
def test_register_portfolio_menu_item_fallback():
    """Portfolio menu hook should fallback to explore_root when no PortfolioPage exists."""
    from portfolio.wagtail_hooks import register_portfolio_menu_item

    menu_item = register_portfolio_menu_item()
    assert menu_item.label == "Portfolio"
    assert menu_item.icon_name == "image"

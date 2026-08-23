"""Tests for site_settings wagtail admin hooks."""

import pytest
from django.test import RequestFactory
from unittest.mock import patch, MagicMock


@pytest.mark.django_db
def test_global_admin_css_returns_html(site):
    """The global_admin_css hook should return style HTML with the primary color."""
    from site_settings.wagtail_hooks import global_admin_css
    from site_settings.models import SiteSettings

    settings_obj = SiteSettings.for_site(site)
    settings_obj.primary_color = "#FF0000"
    settings_obj.save()

    html = global_admin_css()
    assert "#FF0000" in str(html)
    assert "--w-color-primary" in str(html)


@pytest.mark.django_db
def test_global_admin_css_falls_back_to_default(site):
    """global_admin_css should use default color when site has no settings."""
    from site_settings.wagtail_hooks import global_admin_css

    html = global_admin_css()
    assert "#0A3161" in str(html)


@pytest.mark.django_db
def test_prune_menu_items_hides_default_cms_menus(site):
    """prune_menu_items should remove pages, images, snippets and other default menus."""
    from site_settings.wagtail_hooks import prune_menu_items

    mock_item_docs = MagicMock()
    mock_item_docs.name = "documents"
    mock_item_pages = MagicMock()
    mock_item_pages.name = "pages"
    mock_item_images = MagicMock()
    mock_item_images.name = "images"
    mock_item_snippets = MagicMock()
    mock_item_snippets.name = "snippets"
    mock_item_explorer = MagicMock()
    mock_item_explorer.name = "explorer"
    mock_item_reports = MagicMock()
    mock_item_reports.name = "reports"
    mock_item_custom = MagicMock()
    mock_item_custom.name = "services"
    menu_items = [
        mock_item_docs,
        mock_item_pages,
        mock_item_images,
        mock_item_snippets,
        mock_item_explorer,
        mock_item_reports,
        mock_item_custom,
    ]

    request = MagicMock()
    prune_menu_items(request, menu_items)

    remaining_names = [item.name for item in menu_items]
    assert "documents" not in remaining_names
    assert "pages" not in remaining_names
    assert "images" not in remaining_names
    assert "snippets" not in remaining_names
    assert "explorer" not in remaining_names
    assert "reports" not in remaining_names
    assert "services" in remaining_names


@pytest.mark.django_db
def test_register_edit_homepage_menu_item(home_page, site):
    """register_edit_homepage_menu_item should return a MenuItem with edit URL."""
    from site_settings.wagtail_hooks import register_edit_homepage_menu_item

    menu_item = register_edit_homepage_menu_item()
    assert menu_item.label == "Homepage"
    assert str(home_page.id) in menu_item.url
    assert menu_item.icon_name == "home"


@pytest.mark.django_db
def test_register_site_settings_menu_item(site):
    """register_site_settings_menu_item should link to the settings edit view."""
    from site_settings.wagtail_hooks import register_site_settings_menu_item

    menu_item = register_site_settings_menu_item()
    assert menu_item.label == "Site Settings"
    assert menu_item.icon_name == "cog"
    assert "settings" in menu_item.url


@pytest.mark.django_db
def test_add_operations_panel_inserts_panel(site, db):
    """add_operations_panel should prepend an OperationsPanel to the panels list."""
    from site_settings.wagtail_hooks import add_operations_panel

    request = MagicMock()
    panels = []
    add_operations_panel(request, panels)

    assert len(panels) == 1
    assert panels[0].order == 10


@pytest.mark.django_db
def test_operations_panel_renders_three_metrics(home_page, site, db):
    """Operations panel HTML should contain Leads, Services, and Portfolio metrics."""
    from django.test import Client
    from site_settings.wagtail_hooks import add_operations_panel

    request = MagicMock()
    panels = []
    add_operations_panel(request, panels)

    html = str(panels[0].render_html({}))
    assert "New Leads" in html
    assert "Active Services" in html
    assert "Portfolio Items" in html
    assert "View Queue" in html
    assert "Manage Services" in html
    assert "Manage Portfolio" in html

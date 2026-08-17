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
def test_prune_menu_items_hides_documents(site):
    """prune_menu_items should remove documents, reports, explorer items."""
    from site_settings.wagtail_hooks import prune_menu_items

    mock_item_docs = MagicMock()
    mock_item_docs.name = "documents"
    mock_item_docs_2 = MagicMock()
    mock_item_docs_2.name = "reports"
    mock_item_pages = MagicMock()
    mock_item_pages.name = "pages"
    menu_items = [mock_item_docs, mock_item_docs_2, mock_item_pages]

    request = MagicMock()
    prune_menu_items(request, menu_items)

    remaining_names = [item.name for item in menu_items]
    assert "documents" not in remaining_names
    assert "reports" not in remaining_names
    assert "pages" in remaining_names


@pytest.mark.django_db
def test_register_edit_homepage_menu_item(home_page, site):
    """register_edit_homepage_menu_item should return a MenuItem with edit URL."""
    from site_settings.wagtail_hooks import register_edit_homepage_menu_item

    menu_item = register_edit_homepage_menu_item()
    assert menu_item.label == "Edit Homepage"
    assert str(home_page.id) in menu_item.url
    assert menu_item.icon_name == "desktop"


@pytest.mark.django_db
def test_add_operations_panel_inserts_panel(site, db):
    """add_operations_panel should prepend an OperationsPanel to the panels list."""
    from site_settings.wagtail_hooks import add_operations_panel

    request = MagicMock()
    panels = []
    add_operations_panel(request, panels)

    assert len(panels) == 1
    assert panels[0].order == 10

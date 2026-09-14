"""Tests for site_settings wagtail admin hooks."""

from unittest.mock import MagicMock

import pytest


@pytest.mark.django_db
def test_settings_preview_js_is_injected(site):
    """The admin JS hook should register the Preview site button script."""
    from site_settings.wagtail_hooks import settings_preview_js

    js = settings_preview_js()
    text = str(js)
    assert "Preview site" in text
    assert "/admin/settings-preview/" in text
    assert "settings_token" not in text  # URL comes from the endpoint, not the JS


@pytest.mark.django_db
def test_settings_preview_js_is_syntactically_valid(site):
    """The injected script must parse — a malformed script dies silently.

    Regression guard: the click handler was once closed with ``}};`` instead
    of ``}});``, so the whole script failed at parse time on every admin page
    and the Preview button never rendered. ``node --check`` is the real
    syntax check (skipped when node is unavailable, e.g. in the dev
    container); the delimiter balance check below runs everywhere and would
    have caught that bug.
    """
    import re
    import shutil
    import subprocess
    import tempfile
    from pathlib import Path

    from site_settings.wagtail_hooks import settings_preview_js

    script = str(settings_preview_js())
    body = re.search(r"<script>(.*)</script>", script, re.S).group(1)

    # 1. Cheap check, runs everywhere: strip string literals, then require
    #    balanced ( ), { } and [ ] delimiters.
    stripped = re.sub(r'"(?:[^"\\]|\\.)*"', '""', body)
    pairs = {"(": ")", "{": "}", "[": "]"}
    stack = []
    for ch in stripped:
        if ch in pairs:
            stack.append(pairs[ch])
        elif ch in pairs.values():
            assert stack, f"unbalanced '{ch}' in injected script"
            assert stack.pop() == ch, f"mismatched delimiter '{ch}' in injected script"
    assert not stack, f"unclosed delimiters in injected script: {stack}"

    # 2. Real syntax check when node is available.
    node = shutil.which("node")
    if node:
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
            f.write(body)
            path = Path(f.name)
        try:
            result = subprocess.run(
                [node, "--check", str(path)],
                capture_output=True,
                text=True,
            )
            assert result.returncode == 0, f"invalid JS: {result.stderr.strip()}"
        finally:
            path.unlink(missing_ok=True)


@pytest.mark.django_db
def test_global_admin_css_returns_html(site):
    """The global_admin_css hook should return style HTML with the primary color."""
    from site_settings.models import SiteSettings
    from site_settings.wagtail_hooks import global_admin_css

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
def test_register_admin_home_menu_item(site):
    """register_admin_home_menu_item should return a MenuItem linking to the dashboard."""
    from site_settings.wagtail_hooks import register_admin_home_menu_item

    menu_item = register_admin_home_menu_item()
    assert menu_item.label == "Admin Home"
    assert menu_item.icon_name == "home"


@pytest.mark.django_db
def test_register_edit_homepage_menu_item(home_page, site):
    """register_edit_homepage_menu_item should return a MenuItem with edit URL."""
    from site_settings.wagtail_hooks import register_edit_homepage_menu_item

    menu_item = register_edit_homepage_menu_item()
    assert menu_item.label == "Edit Home"
    assert str(home_page.id) in menu_item.url
    assert menu_item.icon_name == "pencil"
    # Regression guard: a "#" placeholder makes the sidebar item a dead click.
    assert menu_item.url not in ("", "#")


@pytest.mark.django_db
def test_register_edit_homepage_menu_item_without_homepage(home_page, site):
    """With no HomePage the item must offer creation, never a dead '#' link.

    ``prune_menu_items`` hides the Pages explorer, so this item is the only way
    to reach the homepage editor.
    """
    from home.models import HomePage
    from site_settings.wagtail_hooks import register_edit_homepage_menu_item

    HomePage.objects.all().delete()

    menu_item = register_edit_homepage_menu_item()
    assert menu_item.url not in ("", "#")
    assert "/pages/add/" in menu_item.url
    assert menu_item.label == "Create Home"
    assert menu_item.icon_name == "pencil"


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

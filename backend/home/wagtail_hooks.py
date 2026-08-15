from django.urls import reverse
from django.utils.html import format_html
from wagtail import hooks
from wagtail.admin.menu import MenuItem


# ---------------------------------------------------------------------------
# 1. Global CSS & Theme Colors
# ---------------------------------------------------------------------------

@hooks.register("insert_global_admin_css")
def global_admin_css():
    """Inject owner-configured brand colors into Wagtail admin.

    Overrides CSS custom properties for the sidebar, header, and primary
    action color.  Falls back to the hardcoded default when SiteSettings
    is unavailable.
    """
    from wagtail.models import Site
    from home.models import SiteSettings

    primary = "#0A3161"
    site = Site.objects.filter(is_default_site=True).first()
    if site:
        settings = SiteSettings.for_site(site)
        primary = getattr(settings, "primary_color", primary) or primary

    return format_html(
        """
        <style>
            :root {{
                --w-color-primary: {primary} !important;
                --w-color-primary-200: {primary} !important;
                --w-color-surface-menu: #072448 !important;
                --w-color-surface-menu-item--active: {primary} !important;
            }}
            .sidebar-main-menu {{
                background-color: #072448 !important;
            }}
            .w-header {{
                background-color: #FAFAFA !important;
                border-bottom: 1px solid #E2E8F0 !important;
            }}
        </style>
        """,
        primary=primary,
    )


# ---------------------------------------------------------------------------
# 2. Custom Dashboard Panel — Operations Hub
# ---------------------------------------------------------------------------

@hooks.register("construct_homepage_panels")
def add_operations_panel(request, panels):
    """Prepend an operations summary panel to the admin homepage."""
    from wagtail.admin.ui.components import Component

    class OperationsPanel(Component):
        order = 10

        def render_html(self, parent_context):
            from leads.models import Lead
            from django.urls import reverse

            leads_url = reverse("wagtailsnippets_leads_lead:list")
            new_count = Lead.objects.filter(status="new").count() if hasattr(Lead, "status") else Lead.objects.count()
            return format_html(
                """
                <section class="w-panel" style="padding:1.5rem;background:#fff;
                    border-left:4px solid #0A3161;margin-bottom:1.5rem;">
                    <h2 style="margin:0;font-size:1.25rem;font-weight:700;
                        color:#0A3161;">Operations Hub</h2>
                    <p style="color:#64748B;margin:0.25rem 0 1rem 0;">
                        You have <strong>{}</strong> customer lead{}.</p>
                    <a href="{}" class="button button-primary"
                       style="background-color:#0A3161;">View Lead Queue</a>
                </section>
                """,
                new_count,
                "" if new_count == 1 else "s",
                leads_url,
            )

    panels.insert(0, OperationsPanel())


# ---------------------------------------------------------------------------
# 3. Sidebar Menu — Prune & Add Quick Links
# ---------------------------------------------------------------------------

@hooks.register("construct_main_menu")
def prune_menu_items(request, menu_items):
    """Hide developer-oriented menu items to keep the admin owner-friendly."""
    hidden = {"documents", "reports", "explorer"}
    menu_items[:] = [item for item in menu_items if item.name not in hidden]


@hooks.register("register_admin_menu_item")
def register_edit_homepage_menu_item():
    """Add a one-click 'Edit Homepage' link to the sidebar."""
    from home.models import HomePage

    home = HomePage.objects.first()
    url = reverse("wagtailadmin_pages:edit", args=[home.id]) if home else "#"
    return MenuItem("Edit Homepage", url, icon_name="desktop", order=150)
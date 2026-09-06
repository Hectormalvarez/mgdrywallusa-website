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

    from site_settings.models import SiteSettings

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
    """Prepend an enhanced operations summary panel to the admin homepage.

    Displays metric badges for Leads, active Services, and Portfolio items
    with direct action buttons for each content type.
    """
    from wagtail.admin.ui.components import Component
    from wagtail.models import Site

    from site_settings.models import SiteSettings

    primary = "#0A3161"
    site_name = "MG Drywall USA"
    site = Site.objects.filter(is_default_site=True).first()
    if site:
        s = SiteSettings.for_site(site)
        primary = getattr(s, "primary_color", primary) or primary
        site_name = getattr(s, "site_name", site_name) or site_name

    class OperationsPanel(Component):
        order = 10

        def render_html(self, parent_context):
            from django.apps import apps
            from django.urls import reverse

            Lead = apps.get_model("leads", "Lead")
            Service = apps.get_model("home", "Service")
            PortfolioItem = apps.get_model("portfolio", "PortfolioItem")
            PortfolioPage = apps.get_model("portfolio", "PortfolioPage")  # noqa: F841

            new_leads = Lead.objects.filter(status="new").count()
            leads_url = reverse("wagtailsnippets_leads_lead:list")

            active_services = Service.objects.filter(is_active=True).count()
            services_url = reverse("wagtailsnippets_home_service:list")

            portfolio_count = PortfolioItem.objects.live().count()
            portfolio_url = reverse("portfolio_items:index")

            return format_html(
                """
                <section class="w-panel" style="padding:1.5rem;background:#fff;
                    border-left:4px solid {primary};margin-bottom:1.5rem;">
                    <h2 style="margin:0;font-size:1.25rem;font-weight:700;
                        color:{primary};">Operations Hub</h2>
                    <p style="color:#64748B;margin:0.25rem 0 1.5rem 0;">
                        Welcome to {site_name} CMS.</p>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
                        <div style="padding:1rem;border:1px solid #e2e8f0;border-radius:0.5rem;">
                            <div style="font-size:0.875rem;color:#64748B;">New Leads</div>
                            <div style="font-size:2rem;font-weight:700;color:{primary};">{new_leads}</div>
                            <a href="{leads_url}" class="button button-small"
                               style="background-color:{primary};color:#fff;margin-top:0.5rem;">View Queue</a>
                        </div>

                        <div style="padding:1rem;border:1px solid #e2e8f0;border-radius:0.5rem;">
                            <div style="font-size:0.875rem;color:#64748B;">Active Services</div>
                            <div style="font-size:2rem;font-weight:700;color:{primary};">{active_services}</div>
                            <a href="{services_url}" class="button button-small"
                               style="background-color:{primary};color:#fff;margin-top:0.5rem;">Manage Services</a>
                        </div>

                        <div style="padding:1rem;border:1px solid #e2e8f0;border-radius:0.5rem;">
                            <div style="font-size:0.875rem;color:#64748B;">Portfolio Items</div>
                            <div style="font-size:2rem;font-weight:700;color:{primary};">{portfolio_count}</div>
                            <a href="{portfolio_url}" class="button button-small"
                               style="background-color:{primary};color:#fff;margin-top:0.5rem;">Manage Portfolio</a>
                        </div>
                    </div>
                </section>
                """,
                new_leads=new_leads,
                active_services=active_services,
                portfolio_count=portfolio_count,
                leads_url=leads_url,
                services_url=services_url,
                portfolio_url=portfolio_url,
                primary=primary,
                site_name=site_name,
            )

    panels.insert(0, OperationsPanel())


# ---------------------------------------------------------------------------
# 3. Sidebar Menu — Prune & Add Quick Links
# ---------------------------------------------------------------------------


@hooks.register("construct_main_menu")
def prune_menu_items(request, menu_items):
    """Hide default CMS menus to keep the admin as a focused business app."""
    hidden = {"pages", "images", "snippets", "documents", "reports", "explorer"}
    menu_items[:] = [item for item in menu_items if item.name not in hidden]


@hooks.register("register_admin_menu_item")
def register_admin_home_menu_item():
    """Add an 'Admin Home' link to the Operations Hub dashboard."""
    return MenuItem("Admin Home", reverse("wagtailadmin_home"), icon_name="home", order=90)


@hooks.register("register_admin_menu_item")
def register_edit_homepage_menu_item():
    """Add a one-click 'Edit Home' link to the sidebar."""
    from django.apps import apps

    HomePage = apps.get_model("home", "HomePage")
    home = HomePage.objects.first()
    url = reverse("wagtailadmin_pages:edit", args=[home.id]) if home else "#"
    return MenuItem("Edit Home", url, icon_name="pencil", order=100)


@hooks.register("register_admin_menu_item")
def register_site_settings_menu_item():
    """Add a top-level Site Settings shortcut linking to the edit view."""
    from wagtail.models import Site

    site = Site.objects.filter(is_default_site=True).first()
    if site:
        url = reverse(
            "wagtailsettings:edit",
            args=["site_settings", "sitesettings", site.pk],
        )
    else:
        url = "#"

    return MenuItem("Site Settings", url, icon_name="cog", order=900)

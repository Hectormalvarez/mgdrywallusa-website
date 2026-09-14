from django.core.management.base import BaseCommand
from wagtail.models import Site

from home.models import HomePage, HomePageFeaturedService, HomePageNavigationItem, Service
from site_settings.models import SiteSettings


class Command(BaseCommand):
    help = "Seeds homepage chrome defaults, operational settings, services, and featured links if not present."

    def handle(self, *args, **options):
        self._ensure_home_page()
        self._seed_homepage_navigation()
        self._seed_operational_settings()
        self._seed_services()
        self.stdout.write(self.style.SUCCESS("Seed defaults verified successfully."))

    def _ensure_home_page(self):
        """Root the default site at a HomePage, replacing Wagtail's stock
        welcome page when the database has none yet.

        Without this the admin's "Edit Home" shortcut has nothing to link to
        and the homepage API returns an empty list.
        """
        if HomePage.objects.exists():
            self.stdout.write("HomePage already exists -- skipping creation.")
            return

        if HomePage.ensure_for_site() is None:
            self.stdout.write(self.style.WARNING("No default site found -- skipping HomePage creation."))
        else:
            self.stdout.write(self.style.SUCCESS("Created HomePage as the default site root."))

    def _seed_homepage_navigation(self):
        """Seed the three default top-navigation links when the homepage has none.

        The homepage's site chrome (US-007) falls back to these defaults at
        the API layer on fresh databases; this gives the editor visible rows
        to work from in dev environments.
        """
        home = HomePage.get_home_for_site()
        if home is None:
            self.stdout.write(self.style.WARNING("No HomePage found -- skipping navigation seed."))
            return

        if home.navigation_items.count() > 0:
            self.stdout.write("Navigation items already exist -- skipping.")
            return

        nav_items = [
            ("Services", "#services", 0),
            ("Our Work", "#portfolio", 1),
            ("Contact", "#lead-form", 2),
        ]
        for label, url, order in nav_items:
            HomePageNavigationItem.objects.create(
                page=home,
                label=label,
                url=url,
                sort_order=order,
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(nav_items)} navigation items."))

    def _seed_operational_settings(self):
        """Ensure the operational SiteSettings (lead alerts, auto-responder)."""
        default_site = Site.objects.filter(is_default_site=True).first()
        if not default_site:
            self.stdout.write(self.style.WARNING("No default site found -- skipping site settings seed."))
            return

        if SiteSettings.objects.filter(site=default_site).exists():
            self.stdout.write("SiteSettings already exist -- skipping creation.")
            return

        SiteSettings.objects.create(
            site=default_site,
            notification_emails="info@mgdrywallusa.com",
            auto_responder_subject="Thank you for contacting MG Drywall USA",
        )
        self.stdout.write(self.style.SUCCESS("Created SiteSettings instance."))

    def _seed_services(self):
        home = HomePage.get_home_for_site()
        if home is None:
            self.stdout.write(self.style.WARNING("No HomePage found -- skipping service seed."))
            return

        if home.featured_services.count() == 0:
            service_data = [
                (
                    "Level 5 Finishing",
                    "level-5-finishing",
                    "Flawless, glass-smooth surfaces for high-end residential interiors and architectural accent walls.",
                    "paint",
                ),
                (
                    "Drywall Repair & Patching",
                    "drywall-repair-patching",
                    "Seamless water damage repairs, stress crack fixes, and texture-matching for ceilings and walls.",
                    "patch",
                ),
                (
                    "ADU & Renovation Framing",
                    "adu-renovation-framing",
                    "Full-service drywall hanging and finishing for garage conversions, room additions, and basements.",
                    "wall",
                ),
            ]
            for order, (name, slug, desc, icon) in enumerate(service_data):
                service, _ = Service.objects.get_or_create(
                    slug=slug,
                    defaults={
                        "name": name,
                        "short_description": desc,
                        "icon": icon,
                        "is_active": True,
                    },
                )
                HomePageFeaturedService.objects.get_or_create(
                    page=home,
                    service=service,
                    defaults={"sort_order": order},
                )
            self.stdout.write(self.style.SUCCESS(f"Seeded {len(service_data)} default services."))
        else:
            self.stdout.write("Featured services already exist -- skipping.")

from django.core.management.base import BaseCommand
from wagtail.models import Site

from home.models import HomePage, HomePageFeaturedService, Service
from site_settings.models import NavigationItem, SiteSettings


class Command(BaseCommand):
    help = "Seeds default site settings, navigation, home page, services, and featured links if not present."

    def handle(self, *args, **options):
        self._seed_site_settings()
        self._seed_services()
        self.stdout.write(self.style.SUCCESS("Seed defaults verified successfully."))

    def _seed_site_settings(self):
        default_site = Site.objects.filter(is_default_site=True).first()
        if not default_site:
            self.stdout.write(self.style.WARNING("No default site found -- skipping site settings seed."))
            return

        existing = SiteSettings.for_site(default_site)
        if existing is None:
            SiteSettings.objects.create(
                site=default_site,
                site_name="MG Drywall USA",
                tagline="Professional drywall installation, repair, and finishing for residential and commercial projects across the nation.",
                phone_number="+1-555-DRYWALL",
                contact_email="info@mgdrywallusa.com",
                license_number="",
                primary_color="#0A3161",
                accent_color="#B31942",
                notification_emails="info@mgdrywallusa.com",
                auto_responder_subject="Thank you for contacting MG Drywall USA",
                banner_enabled=False,
            )
            settings = SiteSettings.for_site(default_site)
            self.stdout.write(self.style.SUCCESS("Created SiteSettings instance."))
        else:
            settings = existing
            self.stdout.write("SiteSettings already exists -- skipping creation.")

        # Seed navigation items if empty
        if settings.navigation_items.count() == 0:
            nav_items = [
                ("Services", "#services", 0),
                ("Our Work", "#portfolio", 1),
                ("Contact", "#lead-form", 2),
            ]
            for label, url, order in nav_items:
                NavigationItem.objects.create(
                    setting=settings,
                    label=label,
                    url=url,
                    sort_order=order,
                )
            self.stdout.write(self.style.SUCCESS(f"Seeded {len(nav_items)} navigation items."))
        else:
            self.stdout.write("Navigation items already exist -- skipping.")

    def _seed_services(self):
        home = HomePage.objects.first()
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

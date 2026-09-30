import json
import os
from urllib.parse import urlparse

from django.conf import settings
from django.core.management.base import BaseCommand
from wagtail.models import Site

from home.models import HomePage, HomePageFeaturedService, HomePageNavigationItem, Service
from site_settings.models import SiteSettings


class Command(BaseCommand):
    help = "Seeds homepage chrome defaults, operational settings, services, and featured links if not present."

    def handle(self, *args, **options):
        self._ensure_home_page()
        self._ensure_default_site_hostname()
        self._seed_homepage_navigation()
        self._seed_operational_settings()
        self._seed_services()
        self.stdout.write(self.style.SUCCESS("Seed defaults verified successfully."))

    def _ensure_default_site_hostname(self):
        """Align the default Site record's hostname with FRONTEND_URL.

        US-008 (ADR-0002): Cloudflare purge URLs are derived from the Site
        record's root_url. If the site record still says `localhost` while
        the deployment's FRONTEND_URL points at the public domain, every
        publish-purge would target the wrong URL. Only acts when
        FRONTEND_URL carries a non-local hostname; safe to re-run.
        """
        parsed = urlparse(settings.FRONTEND_URL)
        hostname = parsed.hostname
        if not hostname or hostname in ("localhost", "127.0.0.1", "0.0.0.0", "example.com"):
            return

        site = Site.objects.filter(is_default_site=True).first()
        if site is None:
            self.stdout.write(self.style.WARNING("No default site found -- skipping hostname sync."))
            return

        if site.hostname == hostname and site.port == (443 if parsed.scheme == "https" else 80):
            return

        site.hostname = hostname
        site.port = 443 if parsed.scheme == "https" else 80
        site.save()
        self.stdout.write(self.style.SUCCESS(f"Default site hostname synced to {hostname}."))

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
            notification_emails=os.getenv("SEED_NOTIFICATION_EMAILS", ""),
            auto_responder_subject=os.getenv("SEED_AUTO_RESPONDER_SUBJECT", "Thank you for contacting us"),
        )
        self.stdout.write(self.style.SUCCESS("Created SiteSettings instance."))
        if not os.getenv("SEED_NOTIFICATION_EMAILS"):
            self.stdout.write(
                self.style.WARNING(
                    "No SEED_NOTIFICATION_EMAILS set — lead alerts will go nowhere until "
                    "the owner sets notification emails in the admin."
                )
            )

    def _seed_services(self):
        home = HomePage.get_home_for_site()
        if home is None:
            self.stdout.write(self.style.WARNING("No HomePage found -- skipping service seed."))
            return

        if home.featured_services.count() == 0:
            service_data = self._service_data()
            demo = os.getenv("SEED_SERVICES_JSON") is None
            if demo:
                self.stdout.write(
                    self.style.WARNING(
                        "Seeding DEMO services (replace-me content). Set SEED_SERVICES_JSON "
                        '— e.g. \'[{"name": "...", "slug": "...", "short_description": "...", "icon": "wall"}]\' '
                        "— or edit them in the admin."
                    )
                )
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

    def _service_data(self):
        """Service seed rows, from SEED_SERVICES_JSON when provided.

        The env value is a JSON array of {name, slug, short_description, icon}.
        Malformed JSON falls back to the labeled demo data rather than failing
        the seed (idempotent bootstrap must never abort a container start).
        """
        raw = os.getenv("SEED_SERVICES_JSON")
        if raw:
            try:
                parsed = json.loads(raw)
                rows = [
                    (
                        str(item["name"]),
                        str(item["slug"]),
                        str(item.get("short_description", "")),
                        str(item.get("icon", "wall")),
                    )
                    for item in parsed
                ]
                if rows:
                    return rows
                self.stdout.write(self.style.WARNING("SEED_SERVICES_JSON parsed to an empty list -- using demo data."))
            except (json.JSONDecodeError, KeyError, TypeError) as exc:
                self.stdout.write(self.style.WARNING(f"SEED_SERVICES_JSON invalid ({exc}) -- using demo data."))

        # Labeled demo content (ADR-0004) — clearly generic drywall examples.
        return [
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

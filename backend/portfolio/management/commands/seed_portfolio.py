"""Idempotent management command to seed the portfolio with sample projects."""

import io

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.management.base import BaseCommand
from PIL import Image as PILImage
from wagtail.images.models import Image

from portfolio.models import PortfolioItem, PortfolioItemImage, PortfolioPage


PROJECTS = [
    {
        "title": "Santa Monica Residential Remodel",
        "slug": "santa-monica-residential-remodel",
        "scope": "residential",
        "description": "<p>Complete drywall removal and reinstallation for a 3,200 sq ft beach-adjacent home. Included level 5 smooth finish throughout living areas and custom texture matching.</p>",
        "tags": ["Level 5 Smooth Finish", "Custom Texture"],
        "color": (14, 48, 97),
    },
    {
        "title": "Culver City Drywall Repair",
        "slug": "culver-city-drywall-repair",
        "scope": "residential",
        "description": "<p>Precision drywall patching and texture matching after water damage remediation in a Craftsman bungalow. Seamless repair across 12 ceiling panels with spray knockdown finish.</p>",
        "tags": ["Level 4 Drywall", "Soundproofing"],
        "color": (56, 110, 163),
    },
    {
        "title": "Venice Beach Office Buildout",
        "slug": "venice-beach-office-buildout",
        "scope": "commercial",
        "description": "<p>Full tenant improvement drywall installation for a 6,000 sq ft creative office on Abbot Kinney Blvd. Included fire-rated shaft-wall assemblies and soundproofing.</p>",
        "tags": ["Level 5 Smooth Finish", "Soundproofing"],
        "color": (10, 49, 97),
    },
    {
        "title": "Burbank Retail Tenant Improvement",
        "slug": "burbank-retail-tenant-improvement",
        "scope": "commercial",
        "description": "<p>High-visibility retail space buildout in the Burbank Town Center featuring specialty curved drywall columns, coffered ceilings, and impact-resistant lower wall panels.</p>",
        "tags": ["Custom Texture", "Level 4 Drywall"],
        "color": (30, 64, 120),
    },
    {
        "title": "Malibu ADU",
        "slug": "malibu-adu",
        "scope": "adu_renovation",
        "description": "<p>Ground-up drywall installation for a 600 sq ft accessory dwelling unit on a hillside lot. Included acoustic insulation and moisture-resistant bathroom panels.</p>",
        "tags": ["Soundproofing", "Level 4 Drywall"],
        "color": (179, 25, 66),
    },
    {
        "title": "Pasadena Garage Conversion",
        "slug": "pasadena-garage-conversion",
        "scope": "adu_renovation",
        "description": "<p>Complete garage-to-living-space conversion with insulated framing, vapor barriers, and level 5 smooth finish throughout. Included ceiling drywall for recessed lighting.</p>",
        "tags": ["Level 5 Smooth Finish", "Custom Texture"],
        "color": (140, 30, 70),
    },
]


class Command(BaseCommand):
    help = "Seed 6 realistic portfolio projects with generated images and finish tags."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Remove all existing portfolio items before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self._clear()

        portfolio_page = self._ensure_portfolio_page()
        created = 0

        for project in PROJECTS:
            existing = PortfolioItem.objects.filter(slug=project["slug"]).first()
            if existing:
                self.stdout.write(f'  Skipped (exists): "{project["title"]}"')
                continue

            item = PortfolioItem(
                title=project["title"],
                slug=project["slug"],
                scope=project["scope"],
                description=project["description"],
            )

            img = self._create_placeholder_image(
                title=f"{project['title']} - Featured",
                color=project["color"],
            )
            item.featured_image = img
            portfolio_page.add_child(instance=item)

            for tag_name in project["tags"]:
                item.finish_tags.add(tag_name)
            item.save()

            for idx in range(1, 3):
                gallery_img = self._create_placeholder_image(
                    title=f"{project['title']} - Gallery {idx}",
                    color=tuple(min(255, c + idx * 20) for c in project["color"]),
                )
                PortfolioItemImage.objects.create(
                    page=item,
                    image=gallery_img,
                    caption=f"Gallery view {idx}",
                    sort_order=idx - 1,
                )

            self.stdout.write(self.style.SUCCESS(f'  Created: "{project["title"]}"'))
            created += 1

        self.stdout.write(
            self.style.SUCCESS(f"Portfolio seed complete: {created} items created.")
        )

    # -- Helpers -----------------------------------------------------------

    def _ensure_portfolio_page(self):
        page = PortfolioPage.objects.first()
        if page:
            return page
        from wagtail.models import Page

        # Prefer attaching under the default site's root page for a proper tree
        from wagtail.models import Site
        site = Site.objects.filter(is_default_site=True).first()
        parent = site.root_page if site else Page.get_first_root_node()
        page = PortfolioPage(title="Portfolio", slug="portfolio")
        parent.add_child(instance=page)
        self.stdout.write(self.style.SUCCESS("Created root PortfolioPage."))
        return page

    def _clear(self):
        items = PortfolioItem.objects.all()
        count = items.count()
        if count:
            items.delete()
            self.stdout.write(self.style.WARNING(f"Deleted {count} portfolio items."))
        else:
            self.stdout.write("No portfolio items to delete.")

    @staticmethod
    def _create_placeholder_image(title, color, width=800, height=600):
        pil_img = PILImage.new("RGB", (width, height), color=color)
        try:
            from PIL import ImageDraw
            draw = ImageDraw.Draw(pil_img)
            text_color = tuple(min(255, c + 120) for c in color)
            draw.text((width // 4, height // 2 - 10), title[:40], fill=text_color)
        except ImportError:
            pass
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        buffer.seek(0)
        return Image.objects.create(
            title=title,
            file=InMemoryUploadedFile(
                buffer,
                "image",
                f"{title[:30].lower().replace(' ', '-')}.png",
                "image/png",
                buffer.getbuffer().nbytes,
                None,
            ),
        )

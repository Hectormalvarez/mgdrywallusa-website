"""Data migration: extract HomePageServiceItem records into Service snippets
and link them back via HomePageFeaturedService through-records."""

from django.db import migrations
from django.utils.text import slugify


def migrate_services_forward(apps, schema_editor):
    Service = apps.get_model("home", "Service")
    HomePageFeaturedService = apps.get_model("home", "HomePageFeaturedService")
    HomePageServiceItem = apps.get_model("home", "HomePageServiceItem")

    service_cache = {}

    for item in HomePageServiceItem.objects.order_by("sort_order").select_related("page"):
        key = (item.title.strip(), item.description.strip(), item.icon_name.strip())
        if key not in service_cache:
            base_slug = slugify(item.title) or "service"
            slug = base_slug
            counter = 1
            while Service.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            service_cache[key] = Service.objects.create(
                name=item.title.strip(),
                slug=slug,
                short_description=item.description.strip(),
                icon=item.icon_name.strip() or "shield",
                is_active=True,
            )

        HomePageFeaturedService.objects.create(
            page_id=item.page_id,
            service=service_cache[key],
            sort_order=item.sort_order,
        )


def migrate_services_backward(apps, schema_editor):
    """Reverse migration: recreate HomePageServiceItem records from snippets."""
    Service = apps.get_model("home", "Service")
    HomePageServiceItem = apps.get_model("home", "HomePageServiceItem")
    HomePageFeaturedService = apps.get_model("home", "HomePageFeaturedService")

    for link in HomePageFeaturedService.objects.order_by("sort_order").select_related("service", "page"):
        HomePageServiceItem.objects.create(
            page_id=link.page_id,
            title=link.service.name,
            description=link.service.short_description,
            icon_name=link.service.icon,
            sort_order=link.sort_order,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0008_service_homepagefeaturedservice"),
    ]

    operations = [
        migrations.RunPython(migrate_services_forward, migrate_services_backward),
    ]

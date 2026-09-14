"""Copy existing SiteSettings chrome onto the HomePage (US-007)."""

from django.db import migrations

# Visitor-facing chrome moved to the homepage; operational-only fields stay.
CHROME_FIELDS = [
    "site_name",
    "tagline",
    "phone_number",
    "contact_email",
    "license_number",
    "logo",
    "favicon",
    "primary_color",
    "accent_color",
    "banner_enabled",
    "banner_text",
    "banner_link",
    "google_review_url",
    "yelp_url",
    "facebook_url",
    "instagram_url",
    "address_locality",
    "address_region",
    "postal_code",
    "country",
    "price_range",
]


def copy_chrome(apps, schema_editor):
    Site = apps.get_model("wagtailcore", "Site")
    HomePage = apps.get_model("home", "HomePage")
    HomePageNavigationItem = apps.get_model("home", "HomePageNavigationItem")
    SiteSettings = apps.get_model("site_settings", "SiteSettings")

    site = Site.objects.filter(is_default_site=True).first() or Site.objects.first()
    if site is None or site.root_page_id is None:
        return
    home = HomePage.objects.filter(id=site.root_page_id).first()
    if home is None:
        return

    settings_obj = SiteSettings.objects.filter(site=site).first() or SiteSettings.objects.first()
    if settings_obj is None:
        return

    for field in CHROME_FIELDS:
        setattr(home, field, getattr(settings_obj, field))
    home.save(update_fields=CHROME_FIELDS)

    for item in settings_obj.navigation_items.all():
        HomePageNavigationItem.objects.create(
            page=home,
            label=item.label,
            url=item.url,
            sort_order=item.sort_order,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("home", "0011_homepage_accent_color_homepage_address_locality_and_more"),
        ("site_settings", "0003_settingspreview"),
    ]

    operations = [
        migrations.RunPython(copy_chrome, migrations.RunPython.noop),
    ]

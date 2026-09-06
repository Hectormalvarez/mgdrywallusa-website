import django.db.models.deletion
import modelcluster.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    """State-only creation of SiteSettings and NavigationItem.

    The PostgreSQL tables already exist (home_sitesettings,
    home_navigationitem).  Explicit db_table options keep Django
    pointing at the same tables.  No SQL is executed.
    """

    initial = True

    dependencies = [
        ("wagtailcore", "0097_baselogentry_uuid_action_timestamp_indexes"),
        ("wagtailimages", "0027_image_description"),
        ("home", "0006_remove_sitesettings_and_navigationitem"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name="SiteSettings",
                    fields=[
                        (
                            "id",
                            models.BigAutoField(
                                auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                            ),
                        ),
                        (
                            "site_name",
                            models.CharField(
                                default="MG Drywall USA",
                                help_text="Business name used across headers, footers, and SEO metadata",
                                max_length=255,
                            ),
                        ),
                        (
                            "tagline",
                            models.TextField(
                                blank=True,
                                default="Professional drywall installation, repair, and finishing for residential and commercial projects across the nation.",
                                help_text="Primary business tagline displayed in the footer",
                            ),
                        ),
                        (
                            "phone_number",
                            models.CharField(
                                default="+1-555-DRYWALL", help_text="Primary public contact phone number", max_length=50
                            ),
                        ),
                        (
                            "contact_email",
                            models.EmailField(
                                default="info@mgdrywallusa.com",
                                help_text="Primary public contact email address",
                                max_length=254,
                            ),
                        ),
                        (
                            "license_number",
                            models.CharField(
                                blank=True, default="", help_text="State contractor license number", max_length=100
                            ),
                        ),
                        ("primary_color", models.CharField(default="#0A3161", max_length=7)),
                        ("accent_color", models.CharField(default="#B31942", max_length=7)),
                        ("notification_emails", models.CharField(default="info@mgdrywallusa.com", max_length=500)),
                        (
                            "auto_responder_subject",
                            models.CharField(default="Thank you for contacting MG Drywall USA", max_length=255),
                        ),
                        (
                            "auto_responder_message",
                            models.TextField(default="Hi {name},\n\nThank you for your quote request."),
                        ),
                        ("banner_enabled", models.BooleanField(default=False)),
                        (
                            "banner_text",
                            models.CharField(
                                blank=True,
                                default="Free on-site estimates for all residential projects!",
                                max_length=255,
                            ),
                        ),
                        ("banner_link", models.CharField(blank=True, default="#lead-form", max_length=255)),
                        ("google_review_url", models.URLField(blank=True, default="")),
                        ("yelp_url", models.URLField(blank=True, default="")),
                        ("facebook_url", models.URLField(blank=True, default="")),
                        ("instagram_url", models.URLField(blank=True, default="")),
                        ("address_locality", models.CharField(blank=True, default="Austin", max_length=100)),
                        ("address_region", models.CharField(blank=True, default="TX", max_length=100)),
                        ("postal_code", models.CharField(blank=True, default="78701", max_length=20)),
                        ("country", models.CharField(blank=True, default="US", max_length=10)),
                        ("price_range", models.CharField(blank=True, default="$$", max_length=10)),
                        (
                            "logo",
                            models.ForeignKey(
                                blank=True,
                                null=True,
                                on_delete=django.db.models.deletion.SET_NULL,
                                related_name="+",
                                to="wagtailimages.image",
                            ),
                        ),
                        (
                            "favicon",
                            models.ForeignKey(
                                blank=True,
                                null=True,
                                on_delete=django.db.models.deletion.SET_NULL,
                                related_name="+",
                                to="wagtailimages.image",
                            ),
                        ),
                        (
                            "site",
                            models.OneToOneField(
                                editable=False, on_delete=django.db.models.deletion.CASCADE, to="wagtailcore.site"
                            ),
                        ),
                    ],
                    options={
                        "abstract": False,
                        "db_table": "home_sitesettings",
                    },
                ),
                migrations.CreateModel(
                    name="NavigationItem",
                    fields=[
                        (
                            "id",
                            models.BigAutoField(
                                auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                            ),
                        ),
                        ("sort_order", models.IntegerField(blank=True, editable=False, null=True)),
                        ("label", models.CharField(max_length=100)),
                        ("url", models.CharField(max_length=255)),
                        (
                            "setting",
                            modelcluster.fields.ParentalKey(
                                on_delete=django.db.models.deletion.CASCADE,
                                related_name="navigation_items",
                                to="site_settings.sitesettings",
                            ),
                        ),
                    ],
                    options={
                        "abstract": False,
                        "db_table": "home_navigationitem",
                        "ordering": ["sort_order"],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]

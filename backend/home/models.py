from django.db import models
from wagtail.models import Page
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.images.api.fields import ImageRenditionField
from wagtail_headless_preview.models import HeadlessPreviewMixin
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting


@register_setting(icon="globe")
class SiteSettings(BaseSiteSetting):
    site_name = models.CharField(
        max_length=255,
        default="MG Drywall USA",
        help_text="Business name used across headers, footers, and SEO metadata",
    )
    tagline = models.TextField(
        blank=True,
        default="Professional drywall installation, repair, and finishing for residential and commercial projects across the nation.",
        help_text="Primary business tagline displayed in the footer",
    )
    phone_number = models.CharField(
        max_length=50,
        default="+1-555-DRYWALL",
        help_text="Primary public contact phone number",
    )
    contact_email = models.EmailField(
        default="info@mgdrywallusa.com",
        help_text="Primary public contact email address",
    )

    # Local SEO & Schema.org defaults
    address_locality = models.CharField(max_length=100, default="Austin", blank=True)
    address_region = models.CharField(max_length=100, default="TX", blank=True)
    postal_code = models.CharField(max_length=20, default="78701", blank=True)
    country = models.CharField(max_length=10, default="US", blank=True)
    price_range = models.CharField(max_length=10, default="$$", blank=True)

    panels = [
        MultiFieldPanel(
            [
                FieldPanel("site_name"),
                FieldPanel("tagline"),
                FieldPanel("phone_number"),
                FieldPanel("contact_email"),
            ],
            heading="General Information",
        ),
        MultiFieldPanel(
            [
                FieldPanel("address_locality"),
                FieldPanel("address_region"),
                FieldPanel("postal_code"),
                FieldPanel("country"),
                FieldPanel("price_range"),
            ],
            heading="Local SEO & Schema.org",
        ),
    ]

    def __str__(self):
        return self.site_name


class HomePage(HeadlessPreviewMixin, Page):
    max_count = 1

    # Hero section fields
    hero_kicker = models.CharField(
        max_length=255,
        blank=True,
        default="Trusted drywall professionals",
    )
    hero_heading = models.CharField(
        max_length=255,
        default="MG Drywall USA",
    )
    hero_subheading = models.TextField(
        blank=True,
        default="Professional drywall installation, repair, and finishing for residential and commercial projects.",
    )
    hero_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    cta_primary_label = models.CharField(
        max_length=100,
        default="Get a Free Quote",
    )
    cta_primary_url = models.CharField(
        max_length=255,
        default="#lead-form",
    )
    cta_secondary_label = models.CharField(
        max_length=100,
        default="View Our Work",
    )
    cta_secondary_url = models.CharField(
        max_length=255,
        default="#portfolio",
    )

    # Portfolio section metadata
    portfolio_heading = models.CharField(
        max_length=255,
        default="Our Work",
        help_text="Header text above the portfolio gallery grid",
    )
    portfolio_empty_text = models.CharField(
        max_length=255,
        default="No projects to display yet.",
        help_text="Fallback text when no portfolio items are published",
    )

    # Lead intake section metadata
    lead_section_heading = models.CharField(
        max_length=255,
        default="Request a Quote",
        help_text="Header text above the contact intake form",
    )
    lead_section_description = models.TextField(
        default="Tell us about your project and we'll get back to you promptly.",
        help_text="Subtitle instruction text below the intake header",
    )

    content_panels = Page.content_panels + [
        MultiFieldPanel(
            [
                FieldPanel("hero_kicker"),
                FieldPanel("hero_heading"),
                FieldPanel("hero_subheading"),
                FieldPanel("hero_image"),
                FieldPanel("cta_primary_label"),
                FieldPanel("cta_primary_url"),
                FieldPanel("cta_secondary_label"),
                FieldPanel("cta_secondary_url"),
            ],
            heading="Hero Section",
        ),
        MultiFieldPanel(
            [
                FieldPanel("portfolio_heading"),
                FieldPanel("portfolio_empty_text"),
            ],
            heading="Portfolio Section",
        ),
        MultiFieldPanel(
            [
                FieldPanel("lead_section_heading"),
                FieldPanel("lead_section_description"),
            ],
            heading="Lead Intake Section",
        ),
    ]

    api_fields = [
        APIField("hero_kicker"),
        APIField("hero_heading"),
        APIField("hero_subheading"),
        APIField(
            "hero_image",
            serializer=ImageRenditionField("fill-1920x1080", source="hero_image"),
        ),
        APIField("cta_primary_label"),
        APIField("cta_primary_url"),
        APIField("cta_secondary_label"),
        APIField("cta_secondary_url"),
        APIField("portfolio_heading"),
        APIField("portfolio_empty_text"),
        APIField("lead_section_heading"),
        APIField("lead_section_description"),
    ]

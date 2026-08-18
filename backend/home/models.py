from django.db import models
from modelcluster.fields import ParentalKey
from wagtail.models import Page, Orderable
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel, MultiFieldPanel, InlinePanel
from wagtail.api import APIField
from wagtail.images.api.fields import ImageRenditionField
from wagtail_headless_preview.models import HeadlessPreviewMixin
from site_settings.models import ServicesField


class HomePage(HeadlessPreviewMixin, Page):
    max_count = 1

    # Hero section fields
    hero_kicker = models.CharField(
        max_length=255,
        blank=True,
        default="Trusted drywall professionals",
        help_text="Short label above the headline, e.g. 'Trusted drywall professionals'",
    )
    hero_heading = models.CharField(
        max_length=255,
        default="MG Drywall USA",
        help_text="Main headline displayed prominently (keep under 50 characters)",
    )
    hero_subheading = models.TextField(
        blank=True,
        default="Professional drywall installation, repair, and finishing for residential and commercial projects.",
        help_text="Supporting text below the headline (1-2 sentences)",
    )
    hero_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="Background image for hero section (1920x1080 or larger, will be cropped to fill)",
    )
    cta_primary_label = models.CharField(
        max_length=100,
        default="Get a Free Quote",
        help_text="Text for the primary action button",
    )
    cta_primary_url = models.CharField(
        max_length=255,
        default="#lead-form",
        help_text="Destination URL or anchor (e.g. '#lead-form' or '/contact')",
    )
    cta_secondary_label = models.CharField(
        max_length=100,
        default="View Our Work",
        help_text="Text for the secondary action button",
    )
    cta_secondary_url = models.CharField(
        max_length=255,
        default="#portfolio",
        help_text="Destination URL or anchor (e.g. '#portfolio' or '/portfolio')",
    )

    # Services section metadata
    services_heading = models.CharField(
        max_length=255,
        default="Our Services",
        help_text="Header text for the services grid",
    )
    services_subheading = models.TextField(
        blank=True,
        default="Specialized drywall installation, repair, and finishing solutions tailored to residential and commercial needs.",
        help_text="Subtitle instruction text below the services header",
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
                FieldPanel("services_heading"),
                FieldPanel("services_subheading"),
            ],
            heading="Services Section Header",
        ),
        InlinePanel("services", label="Service Items"),
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
            serializer=ImageRenditionField("fill-1920x1080"),
        ),
        APIField("cta_primary_label"),
        APIField("cta_primary_url"),
        APIField("cta_secondary_label"),
        APIField("cta_secondary_url"),
        APIField("services_heading"),
        APIField("services_subheading"),
        APIField("services", serializer=ServicesField()),
        APIField("portfolio_heading"),
        APIField("portfolio_empty_text"),
        APIField("lead_section_heading"),
        APIField("lead_section_description"),
    ]


class HomePageServiceItem(Orderable):
    page = ParentalKey(
        HomePage,
        on_delete=models.CASCADE,
        related_name="services",
    )
    title = models.CharField(
        max_length=150,
        help_text="Service name displayed on the card (e.g. 'Level 5 Finishing')",
    )
    description = models.TextField(
        help_text="Brief service description (2-3 sentences, shown on the service card)",
    )
    icon_name = models.CharField(
        max_length=50,
        default="shield",
        help_text="Icon identifier. One of: wall, patch, paint, shield",
        blank=True,
    )

    panels = [
        FieldPanel("title"),
        FieldPanel("description"),
        FieldPanel("icon_name"),
    ]

    def __str__(self):
        return self.title

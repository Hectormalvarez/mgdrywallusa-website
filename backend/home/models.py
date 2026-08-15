from django.db import models
from wagtail.models import Page
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField
from wagtail.images.api.fields import ImageRenditionField


class HomePage(Page):
    """Wagtail page powering the site's hero / landing section."""

    hero_kicker = models.CharField(
        max_length=120,
        blank=True,
        help_text="Small label above the heading (e.g. 'Trusted drywall professionals')",
    )
    hero_heading = models.CharField(
        max_length=200,
        blank=True,
        help_text="Main hero headline",
    )
    hero_subheading = RichTextField(
        blank=True,
        help_text="Supporting text beneath the headline",
    )
    hero_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    # Call-to-action buttons
    cta_primary_label = models.CharField(
        max_length=60,
        blank=True,
        help_text="Primary CTA button text (e.g. 'Get a Free Quote')",
    )
    cta_primary_url = models.CharField(
        max_length=255,
        blank=True,
        help_text="Primary CTA destination URL or anchor (e.g. '#lead-form')",
    )
    cta_secondary_label = models.CharField(
        max_length=60,
        blank=True,
        help_text="Secondary CTA button text (e.g. 'View Our Work')",
    )
    cta_secondary_url = models.CharField(
        max_length=255,
        blank=True,
        help_text="Secondary CTA destination URL or anchor (e.g. '#portfolio')",
    )

    content_panels = Page.content_panels + [
        FieldPanel("hero_kicker"),
        FieldPanel("hero_heading"),
        FieldPanel("hero_subheading"),
        FieldPanel("hero_image"),
        FieldPanel("cta_primary_label"),
        FieldPanel("cta_primary_url"),
        FieldPanel("cta_secondary_label"),
        FieldPanel("cta_secondary_url"),
    ]

    api_fields = [
        APIField("hero_kicker"),
        APIField("hero_heading"),
        APIField("hero_subheading"),
        APIField(
            "hero_image_url",
            serializer=ImageRenditionField("fill-1920x1080", source="hero_image"),
        ),
        APIField("cta_primary_label"),
        APIField("cta_primary_url"),
        APIField("cta_secondary_label"),
        APIField("cta_secondary_url"),
    ]

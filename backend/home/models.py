from django.db import models
from wagtail.models import Page
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField


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

    content_panels = Page.content_panels + [
        FieldPanel("hero_kicker"),
        FieldPanel("hero_heading"),
        FieldPanel("hero_subheading"),
    ]

    api_fields = [
        APIField("hero_kicker"),
        APIField("hero_heading"),
        APIField("hero_subheading"),
    ]

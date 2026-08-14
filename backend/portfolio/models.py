from django.db import models
from wagtail.models import Page
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel
from wagtail.api import APIField


class PortfolioItem(Page):
    """A single portfolio item page."""
    
    description = RichTextField(blank=True)
    image = models.ForeignKey(
        'wagtailimages.Image',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
    )

    content_panels = Page.content_panels + [
        FieldPanel('description'),
        FieldPanel('image'),
    ]

    @property
    def image_url(self):
        """Return the URL for a rendition of the image, or None."""
        if self.image:
            return self.image.get_rendition('fill-800x600').url
        return None

    api_fields = [
        APIField('description'),
        APIField('image_url'),
    ]

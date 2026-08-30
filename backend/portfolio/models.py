from django.db import models
from modelcluster.contrib.taggit import ClusterTaggableManager
from modelcluster.fields import ParentalKey
from taggit.models import TaggedItemBase
from wagtail.models import Page, Orderable
from wagtail.fields import RichTextField
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.api import APIField

from .serializers import GalleryImageField, OptimizedPortfolioImageField, TagsField


class PortfolioItemTag(TaggedItemBase):
    content_object = ParentalKey(
        "portfolio.PortfolioItem",
        on_delete=models.CASCADE,
        related_name="tagged_items",
    )


class PortfolioPage(Page):
    intro = RichTextField(blank=True)

    content_panels = Page.content_panels + [
        FieldPanel("intro"),
    ]

    api_fields = [
        APIField("intro"),
    ]

    subpage_types = ["portfolio.PortfolioItem"]


class PortfolioItem(Page):
    SCOPE_CHOICES = [
        ("residential", "Residential"),
        ("commercial", "Commercial"),
        ("adu_renovation", "ADU / Renovation"),
    ]

    scope = models.CharField(
        max_length=50,
        choices=SCOPE_CHOICES,
        blank=True,
        help_text="Project scope or category",
    )
    description = RichTextField(
        blank=True,
        help_text="Brief project summary shown on the portfolio card (supports formatted text)",
    )
    featured_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="Main project image (800x600 or larger, will be cropped to fill)",
    )
    sort_order = models.IntegerField(
        default=0,
        help_text="Controls the display order on the portfolio listing (lower first)",
    )
    finish_tags = ClusterTaggableManager(
        through=PortfolioItemTag,
        blank=True,
        verbose_name="Finish Tags",
    )

    # ── Page tree constraints ────────────────────────────────────────────
    parent_page_types = ["portfolio.PortfolioPage"]

    # ── Display helpers ──────────────────────────────────────────────────

    @property
    def scope_label(self) -> str:
        """Human-readable label for the project scope."""
        labels = dict(self.SCOPE_CHOICES)
        return labels.get(self.scope, "")

    content_panels = Page.content_panels + [
        MultiFieldPanel(
            [
                FieldPanel("sort_order"),
                FieldPanel("scope"),
                FieldPanel("description"),
            ],
            heading="Project Details",
        ),
        MultiFieldPanel(
            [
                FieldPanel("featured_image"),
                InlinePanel("gallery_images", label="Gallery Images"),
            ],
            heading="Images",
        ),
        MultiFieldPanel(
            [
                FieldPanel("finish_tags"),
            ],
            heading="Tags",
        ),
    ]

    api_fields = [
        APIField("sort_order"),
        APIField("scope"),
        APIField("scope_label"),
        APIField("description"),
        APIField("finish_tags", serializer=TagsField()),
        APIField(
            "featured_image",
            serializer=OptimizedPortfolioImageField(),
        ),
        APIField(
            "gallery_images",
            serializer=GalleryImageField(),
        ),
    ]


class PortfolioItemImage(Orderable):
    page = ParentalKey(
        PortfolioItem,
        on_delete=models.CASCADE,
        related_name="gallery_images",
    )
    image = models.ForeignKey(
        "wagtailimages.Image",
        on_delete=models.CASCADE,
        related_name="+",
        help_text="Gallery image (800x600 or larger, will be cropped to fill)",
    )
    caption = models.CharField(
        max_length=255,
        blank=True,
        help_text="Optional caption displayed below the gallery image",
    )

    panels = [
        FieldPanel("image"),
        FieldPanel("caption"),
    ]


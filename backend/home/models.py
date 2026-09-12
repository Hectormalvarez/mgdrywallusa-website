from django.db import models
from django.utils.text import slugify
from modelcluster.fields import ParentalKey
from wagtail.admin.panels import FieldPanel, InlinePanel, MultiFieldPanel
from wagtail.api import APIField
from wagtail.images.api.fields import ImageRenditionField
from wagtail.models import Orderable, Page
from wagtail_headless_preview.models import HeadlessPreviewMixin

from home.serializers import FeaturedServicesField


class Service(models.Model):
    """Standalone service snippet managed independently of the homepage."""

    name = models.CharField(
        max_length=150,
        help_text="Service name displayed on the card (e.g. 'Level 5 Finishing')",
    )
    slug = models.SlugField(
        unique=True,
        help_text="URL-safe identifier derived from the service name",
    )
    short_description = models.TextField(
        help_text="Brief service description (2-3 sentences, shown on the service card)",
    )
    icon = models.CharField(
        max_length=50,
        default="shield",
        blank=True,
        help_text="Icon identifier. One of: wall, patch, paint, shield",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Uncheck to hide this service from the public site without deleting it",
    )

    panels = [
        FieldPanel("name"),
        FieldPanel("slug"),
        FieldPanel("short_description"),
        FieldPanel("icon"),
        FieldPanel("is_active"),
    ]

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


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
        InlinePanel("featured_services", label="Featured Services"),
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
        APIField("featured_services", serializer=FeaturedServicesField()),
        APIField("portfolio_heading"),
        APIField("portfolio_empty_text"),
        APIField("lead_section_heading"),
        APIField("lead_section_description"),
    ]

    # ── Site integration helpers ─────────────────────────────────────────

    @classmethod
    def get_home_for_site(cls, site=None):
        """Return the HomePage serving ``site`` (the default site when omitted).

        Resolves the page the site is actually rooted at instead of assuming a
        single global HomePage, then falls back to the first HomePage in the
        tree for databases whose site root was never repointed.  Returns None
        when no HomePage exists at all.
        """
        from wagtail.models import Site

        if site is None:
            site = Site.objects.filter(is_default_site=True).first() or Site.objects.first()
        if site is not None and site.root_page is not None:
            root = site.root_page.specific
            if isinstance(root, cls):
                return root
        return cls.objects.first()

    @classmethod
    def ensure_for_site(cls, site=None):
        """Return the site's HomePage, creating it when the site is still
        rooted at Wagtail's stock "Welcome to your new Wagtail site!" page.

        Children of the replaced page (for example the PortfolioPage subtree)
        are reparented under the new HomePage so their URLs are preserved.
        Returns the existing HomePage, a newly created one, or None when there
        is no site to attach it to.

        Used by ``manage.py seed`` and the ``home.bootstrap`` post_migrate hook
        so a fresh or reset database matches production instead of leaving the
        admin's "Edit Home" shortcut pointing at nothing.
        """
        from wagtail.models import Site

        if site is None:
            site = Site.objects.filter(is_default_site=True).first() or Site.objects.first()
        if site is None:
            return None

        existing = cls.get_home_for_site(site)
        if existing is not None:
            return existing

        old_root = site.root_page
        parent = old_root.get_parent() if old_root is not None else None
        if parent is None:
            return None

        # Siblings cannot share a slug, so rename the page being replaced before
        # the HomePage claims its slug. It is deleted at the end of this method.
        desired_slug = old_root.slug or "home"
        taken = set(parent.get_children().values_list("slug", flat=True))
        replacement_slug = f"{desired_slug}-replaced"
        counter = 1
        while replacement_slug in taken:
            replacement_slug = f"{desired_slug}-replaced-{counter}"
            counter += 1
        old_root.slug = replacement_slug
        old_root.set_url_path(parent)
        old_root.save(update_fields=["slug", "url_path"])

        # Detach the children next: deleting a page removes its whole subtree.
        children = list(old_root.get_children())
        for child in children:
            child.move(parent, pos="last-child")

        home = cls(title="Home", slug=desired_slug, live=True)
        parent.add_child(instance=home)

        for child in children:
            child.move(home, pos="last-child")

        # Repoint the site *before* deleting: Site.root_page is CASCADE, so
        # deleting a page the site still points at would delete the site.
        site.root_page = home
        site.save(update_fields=["root_page"])

        old_root.delete()
        return home


class HomePageFeaturedService(Orderable):
    """Through-model linking HomePage to Service snippets with display ordering."""

    page = ParentalKey(
        HomePage,
        on_delete=models.CASCADE,
        related_name="featured_services",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="+",
        help_text="Select a service to feature on the homepage",
    )

    panels = [
        FieldPanel("service"),
    ]

    def __str__(self):
        return f"{self.page.title} — {self.service.name}"

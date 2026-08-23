from django.db import models
from modelcluster.fields import ParentalKey
from modelcluster.models import ClusterableModel
from wagtail.models import Orderable
from wagtail.admin.panels import FieldPanel, MultiFieldPanel, InlinePanel
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting




@register_setting(icon="cog-full")
class SiteSettings(BaseSiteSetting, ClusterableModel):
    # ── General & Identity ─────────────────────────────────────────────
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
    license_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="State contractor license number – rendered in trust badges",
    )

    # ── Brand Theme & Logos ────────────────────────────────────────────
    logo = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="Company logo (PNG or SVG recommended)",
    )
    favicon = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="Browser tab icon (square, 32×32 or 64×64)",
    )
    primary_color = models.CharField(
        max_length=7,
        default="#0A3161",
        help_text="Hex code for primary brand color (e.g. #0A3161)",
    )
    accent_color = models.CharField(
        max_length=7,
        default="#B31942",
        help_text="Hex code for action buttons and accents (e.g. #B31942)",
    )

    # ── Lead Alerts & Auto-Responder ───────────────────────────────────
    notification_emails = models.CharField(
        max_length=500,
        default="info@mgdrywallusa.com",
        help_text="Comma-separated emails to receive incoming quote requests",
    )
    auto_responder_subject = models.CharField(
        max_length=255,
        default="Thank you for contacting MG Drywall USA",
        help_text="Subject line for homeowner confirmation email",
    )
    auto_responder_message = models.TextField(
        default=(
            "Hi {name},\n\n"
            "Thank you for requesting a quote for your {project_tier} project. "
            "We have received your request and will follow up within one business day.\n\n"
            "— MG Drywall USA"
        ),
        help_text="Email body sent to homeowners. Placeholders: {name}, {project_tier}, {phone}",
    )

    # ── Promotional / Announcement Banner ──────────────────────────────
    banner_enabled = models.BooleanField(
        default=False,
        help_text="Show announcement bar at the very top of the site",
    )
    banner_text = models.CharField(
        max_length=255,
        blank=True,
        default="Free on-site estimates for all residential projects!",
        help_text="Text shown inside the announcement bar",
    )
    banner_link = models.CharField(
        max_length=255,
        blank=True,
        default="#lead-form",
        help_text="URL or anchor the banner links to",
    )

    # ── Social & Review Links ──────────────────────────────────────────
    google_review_url = models.URLField(
        blank=True,
        default="",
        help_text="Direct link to leave a Google Review",
    )
    yelp_url = models.URLField(blank=True, default="")
    facebook_url = models.URLField(blank=True, default="")
    instagram_url = models.URLField(blank=True, default="")

    # ── Local SEO & Schema.org defaults ────────────────────────────────
    address_locality = models.CharField(max_length=100, default="Austin", blank=True)
    address_region = models.CharField(max_length=100, default="TX", blank=True)
    postal_code = models.CharField(max_length=20, default="78701", blank=True)
    country = models.CharField(max_length=10, default="US", blank=True)
    price_range = models.CharField(max_length=10, default="$$", blank=True)

    class Meta:
        db_table = "home_sitesettings"  # Preserve existing production table

    panels = [
        MultiFieldPanel(
            [
                FieldPanel("site_name"),
                FieldPanel("tagline"),
                FieldPanel("phone_number"),
                FieldPanel("contact_email"),
                FieldPanel("license_number"),
            ],
            heading="General Information",
        ),
        MultiFieldPanel(
            [
                FieldPanel("logo"),
                FieldPanel("favicon"),
                FieldPanel("primary_color"),
                FieldPanel("accent_color"),
            ],
            heading="Brand Theme & Logos",
        ),
        MultiFieldPanel(
            [
                FieldPanel("notification_emails"),
                FieldPanel("auto_responder_subject"),
                FieldPanel("auto_responder_message"),
            ],
            heading="Lead Alerts & Auto-Responder",
        ),
        MultiFieldPanel(
            [
                FieldPanel("banner_enabled"),
                FieldPanel("banner_text"),
                FieldPanel("banner_link"),
            ],
            heading="Announcement Banner",
        ),
        MultiFieldPanel(
            [
                FieldPanel("google_review_url"),
                FieldPanel("yelp_url"),
                FieldPanel("facebook_url"),
                FieldPanel("instagram_url"),
            ],
            heading="Social & Review Links",
        ),
        InlinePanel("navigation_items", label="Navigation Links"),
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


class NavigationItem(Orderable):
    setting = ParentalKey(
        SiteSettings,
        on_delete=models.CASCADE,
        related_name="navigation_items",
    )
    label = models.CharField(max_length=100, help_text="Link text displayed in menu")
    url = models.CharField(max_length=255, help_text="Target URL or anchor (e.g. #portfolio)")

    class Meta:
        db_table = "home_navigationitem"  # Preserve existing production table
        ordering = ["sort_order"]

    panels = [
        FieldPanel("label"),
        FieldPanel("url"),
    ]

    def __str__(self):
        return self.label

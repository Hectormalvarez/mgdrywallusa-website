from django.db import models
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting


@register_setting(icon="cog-full")
class SiteSettings(BaseSiteSetting):
    """Operational-only site configuration (US-007).

    Visitor-facing site chrome — identity, branding, navigation, banner,
    social links, and local SEO — lives on the site's HomePage, where it
    gets draft state, the page editor's live preview, and publish/revision
    semantics. Only back-office configuration that never renders on the
    public site remains here.
    """

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

    panels = [
        MultiFieldPanel(
            [
                FieldPanel("notification_emails"),
                FieldPanel("auto_responder_subject"),
                FieldPanel("auto_responder_message"),
            ],
            heading="Lead Alerts & Auto-Responder",
        ),
    ]

    class Meta:
        db_table = "home_sitesettings"  # Preserve existing production table

    def __str__(self):
        return "Site operations settings"

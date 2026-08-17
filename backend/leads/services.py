"""Storage and notification services for the leads app."""

import logging
import threading
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.core.files.uploadedfile import InMemoryUploadedFile

    from leads.models import Lead

logger = logging.getLogger(__name__)


class StorageService:
    """Handles file persistence for lead photo attachments."""

    @staticmethod
    def store_photos(
        lead: "Lead", photos: list["InMemoryUploadedFile"]
    ) -> None:
        """Save each uploaded photo as a LeadAttachment linked to *lead*."""
        from leads.models import LeadAttachment

        for photo in photos:
            LeadAttachment.objects.create(lead=lead, file=photo)


def notify_lead_created(lead: "Lead") -> None:
    """Dispatch decoupled notifications in a background thread.

    In local-dev (DEBUG=True) both messages are written to the console log.
    In production this would send real email / SMS / webhook payloads.
    """
    thread = threading.Thread(
        target=_send_notifications,
        args=(lead.pk,),
        daemon=True,
    )
    thread.start()


def _send_notifications(lead_pk: int) -> None:
    """Runs in a background thread — never blocks the request."""
    from leads.models import Lead

    try:
        lead = Lead.objects.get(pk=lead_pk)
    except Lead.DoesNotExist:
        logger.warning("Lead %s not found — skipping notification.", lead_pk)
        return

    _send_contractor_alert(lead)
    _send_homeowner_confirmation(lead)


# ---------------------------------------------------------------------------
# Helper: resolve SiteSettings once per notification dispatch
# ---------------------------------------------------------------------------

def _get_site_settings():
    """Return SiteSettings for the default site, or None."""
    try:
        from wagtail.models import Site
        from site_settings.models import SiteSettings

        default_site = Site.objects.filter(is_default_site=True).first()
        if default_site:
            return SiteSettings.for_site(default_site)
    except Exception:
        logger.debug("Could not load SiteSettings — using hardcoded fallback.")
    return None


def _send_contractor_alert(lead: "Lead") -> None:
    """Send contractor-facing alert to all configured notification emails."""
    settings = _get_site_settings()

    # Build recipient list: prefer SiteSettings, fall back to env-based list
    if settings and settings.notification_emails:
        recipients = [
            email.strip()
            for email in settings.notification_emails.split(",")
            if email.strip()
        ]
    else:
        from django.conf import settings as django_settings

        recipients = getattr(django_settings, "LEAD_NOTIFICATION_EMAILS", [])
        if not recipients:
            recipients = ["info@mgdrywallusa.com"]

    attachment_count = lead.attachments.count()
    msg = (
        f"[CONTRACTOR ALERT] New lead received!\n"
        f"  Name:   {lead.name}\n"
        f"  Phone:  {lead.phone}\n"
        f"  Email:  {lead.email}\n"
        f"  Tier:   {lead.get_project_tier_display()}\n"
        f"  Details: {lead.details or '(none)'}\n"
        f"  Photos: {attachment_count}\n"
        f"  Time:   {lead.submitted_at}\n"
        f"  Recipients: {', '.join(recipients)}"
    )
    logger.info(msg)


def _send_homeowner_confirmation(lead: "Lead") -> None:
    """Send homeowner confirmation using the dynamic auto-responder template."""
    settings = _get_site_settings()

    if settings and settings.auto_responder_message:
        body = settings.auto_responder_message.format(
            name=lead.name,
            project_tier=lead.get_project_tier_display(),
            phone=lead.phone,
        )
    else:
        body = (
            f"Hi {lead.name}, thanks for reaching out! "
            f"We'll review your {lead.get_project_tier_display()} project "
            f"and get back to you within one business day."
        )

    subject = (
        settings.auto_responder_subject
        if settings
        else "Thank you for contacting MG Drywall USA"
    )

    logger.info(
        "[HOMEOWNER CONFIRMATION] Lead acknowledged — "
        "confirmation to %s\n  Subject: %s\n  Body: %s",
        lead.email,
        subject,
        body,
    )

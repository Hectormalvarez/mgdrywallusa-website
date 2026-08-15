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

    _log_contractor_alert(lead)
    _log_homeowner_confirmation(lead)


def _log_contractor_alert(lead: "Lead") -> None:
    """Log a contractor-facing alert (console in dev, email/SMS in prod)."""
    attachment_count = lead.attachments.count()
    msg = (
        f"[CONTRACTOR ALERT] New lead received!\n"
        f"  Name:   {lead.name}\n"
        f"  Phone:  {lead.phone}\n"
        f"  Email:  {lead.email}\n"
        f"  Tier:   {lead.get_project_tier_display()}\n"
        f"  Details: {lead.details or '(none)'}\n"
        f"  Photos: {attachment_count}\n"
        f"  Time:   {lead.submitted_at}"
    )
    logger.info(msg)


def _log_homeowner_confirmation(lead: "Lead") -> None:
    """Log a homeowner confirmation (console in dev, email in prod)."""
    msg = (
        f"[HOMEOWNER CONFIRMATION] Lead acknowledged — "
        f"confirmation to {lead.email}\n"
        f"  Hi {lead.name}, thanks for reaching out! "
        f"We'll review your {lead.get_project_tier_display()} project "
        f"and get back to you within one business day."
    )
    logger.info(msg)

"""Storage services for the leads app."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.core.files.uploadedfile import InMemoryUploadedFile

    from leads.models import Lead


class StorageService:
    """Handles file persistence for lead photo attachments."""

    @staticmethod
    def store_photos(lead: "Lead", photos: list["InMemoryUploadedFile"]) -> None:
        """Save each uploaded photo as a LeadAttachment linked to *lead*."""
        from leads.models import LeadAttachment

        for photo in photos:
            LeadAttachment.objects.create(lead=lead, file=photo)

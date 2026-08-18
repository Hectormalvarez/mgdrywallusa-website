"""DRF serializers for the leads app."""

import os
import re

from rest_framework import serializers

from leads.models import Lead, TIER_CHOICES

VALID_TIERS = {choice[0] for choice in TIER_CHOICES}

US_PHONE_RE = re.compile(
    r"^(\+1[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3,4}[\s\-]?\d{0,4}$"
)

MAX_FILES = 3
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB cumulative

VALID_PHOTO_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
VALID_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Honeypot field name — if present and non-empty, treat as spam
HONEYPOT_FIELD = "company"


class LeadSerializer(serializers.Serializer):
    """Validates a lead submission arriving as multipart/form-data."""

    name = serializers.CharField(max_length=255, trim_whitespace=True)
    phone = serializers.CharField(max_length=50, trim_whitespace=True)
    email = serializers.EmailField()
    project_tier = serializers.ChoiceField(choices=TIER_CHOICES)
    details = serializers.CharField(
        required=False, default="", allow_blank=True
    )
    company = serializers.CharField(
        required=False, default="", allow_blank=True
    )
    photos = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        default=[],
    )

    def validate_phone(self, value: str) -> str:
        if not US_PHONE_RE.match(value):
            raise serializers.ValidationError(
                "Enter a valid US phone number (e.g. 555-123-4567)."
            )
        return value

    def validate_photos(self, files: list) -> list:
        if len(files) > MAX_FILES:
            raise serializers.ValidationError(
                f"No more than {MAX_FILES} files allowed."
            )
        total = 0
        for f in files:
            if f.content_type not in VALID_PHOTO_MIME_TYPES:
                raise serializers.ValidationError(
                    f"'{f.name}' is not a supported image type. "
                    f"Allowed types: JPEG, PNG, WebP."
                )
            # Check file extension as a basic safeguard against spoofed uploads
            ext = os.path.splitext(f.name or "")[1].lower()
            if ext not in VALID_PHOTO_EXTENSIONS:
                raise serializers.ValidationError(
                    f"'{f.name}' has an invalid file extension. "
                    f"Allowed extensions: .jpg, .jpeg, .png, .webp."
                )
            if f.size > MAX_FILE_SIZE_BYTES:
                raise serializers.ValidationError(
                    f"'{f.name}' exceeds the 10 MB limit."
                )
            total += f.size
        if total > MAX_TOTAL_SIZE_BYTES:
            raise serializers.ValidationError(
                "Total upload size exceeds 10 MB."
            )
        return files

    def validate(self, data):
        """Honeypot check — silently discard if the hidden field is filled."""
        if data.get(HONEYPOT_FIELD):
            raise serializers.ValidationError(
                {HONEYPOT_FIELD: "spam detected"}
            )
        return data


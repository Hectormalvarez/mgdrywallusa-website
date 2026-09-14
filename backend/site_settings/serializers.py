"""DRF serializers for the site_settings app."""

from rest_framework import serializers

from site_settings.models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serializes the operational SiteSettings for the public API (US-007).

    Visitor-facing chrome is served from the homepage's API fields; only
    back-office configuration remains here.
    """

    class Meta:
        model = SiteSettings
        fields = [
            "notification_emails",
            "auto_responder_subject",
            "auto_responder_message",
        ]

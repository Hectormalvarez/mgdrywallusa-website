"""DRF serializers for the site_settings app."""

from rest_framework import serializers

from site_settings.models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serializes the full SiteSettings model for the public API.

    Includes computed ``logo_url`` and ``favicon_url`` fields that resolve
    Wagtail image rendition URLs at serialization time.  SEO fields are
    nested under a ``seo`` object to match the frontend ``SiteSeoSettings``
    type.
    """

    logo_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    nav = serializers.SerializerMethodField()
    seo = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = [
            "site_name",
            "tagline",
            "phone_number",
            "contact_email",
            "license_number",
            # Branding
            "logo_url",
            "favicon_url",
            "primary_color",
            "accent_color",
            # Banner
            "banner_enabled",
            "banner_text",
            "banner_link",
            # Social links
            "google_review_url",
            "yelp_url",
            "facebook_url",
            "instagram_url",
            # Nested SEO
            "seo",
            "nav",
        ]

    def get_logo_url(self, obj):
        from core.utils import resolve_image_url

        return resolve_image_url(obj.logo)

    def get_favicon_url(self, obj):
        from core.utils import resolve_image_url

        return resolve_image_url(obj.favicon)

    def get_nav(self, obj):
        """Build navigation list; fall back to sensible defaults."""
        nav_items = list(obj.navigation_items.values("label", "url"))
        if not nav_items:
            nav_items = [
                {"label": "Services", "url": "#services"},
                {"label": "Our Work", "url": "#portfolio"},
                {"label": "Contact", "url": "#lead-form"},
            ]
        # Remap "url" key to "href" for frontend contract consistency
        return [{"label": item["label"], "href": item["url"]} for item in nav_items]

    def get_seo(self, obj):
        """Nest SEO fields under a ``seo`` key for the frontend."""
        return {
            "address_locality": obj.address_locality,
            "address_region": obj.address_region,
            "postal_code": obj.postal_code,
            "country": obj.country,
            "price_range": obj.price_range,
        }

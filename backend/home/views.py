from django.http import JsonResponse
from django.views import View
from wagtail_headless_preview.models import PagePreview

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from wagtail.models import Site
from .models import HomePage
from site_settings.models import SiteSettings


class PagePreviewAPIView(View):
    """Return stored preview data as JSON given a valid token."""

    def get(self, request, token):
        try:
            preview = PagePreview.objects.get(token=token)
        except PagePreview.DoesNotExist:
            return JsonResponse({"error": "Invalid or expired preview token"}, status=404)

        page = preview.as_page()

        if not isinstance(page, HomePage):
            return JsonResponse({"error": "Unsupported content type"}, status=400)

        data = {
            "id": page.id,
            "title": page.title,
        }

        for api_field in HomePage.api_fields:
            name = api_field.name
            serializer = api_field.serializer
            value = getattr(page, name, None)

            if value is None:
                data[name] = None
            elif serializer is not None:
                data[name] = serializer.to_representation(value)
            else:
                data[name] = value

        return JsonResponse(data)


class SiteSettingsAPIView(APIView):
    """
    GET /api/v1/settings/
    Exposes global SiteSettings for the default or requested Wagtail Site.
    """

    def get(self, request, *args, **kwargs):
        current_site = Site.find_for_request(request) or Site.objects.filter(is_default_site=True).first()
        if not current_site:
            return Response({"error": "Site not configured"}, status=status.HTTP_404_NOT_FOUND)

        settings = SiteSettings.for_site(current_site)

        # Build navigation from InlinePanel records; fall back to sensible
        # defaults when no items have been saved in Wagtail admin yet.
        nav_items = list(settings.navigation_items.values("label", "url"))
        if not nav_items:
            nav_items = [
                {"label": "Services", "url": "#services"},
                {"label": "Our Work", "url": "#portfolio"},
                {"label": "Contact", "url": "#lead-form"},
            ]

        # Remap "url" key to "href" for frontend contract consistency
        formatted_nav = [{"label": item["label"], "href": item["url"]} for item in nav_items]

        # Resolve logo URL from the Wagtail image if uploaded
        logo_url = None
        if settings.logo:
            try:
                logo_url = settings.logo.get_rendition("original").url
            except Exception:
                logo_url = None

        favicon_url = None
        if settings.favicon:
            try:
                favicon_url = settings.favicon.get_rendition("original").url
            except Exception:
                favicon_url = None

        return Response(
            {
                "site_name": settings.site_name,
                "tagline": settings.tagline,
                "phone_number": settings.phone_number,
                "contact_email": settings.contact_email,
                "license_number": settings.license_number,
                # Branding
                "logo_url": logo_url,
                "favicon_url": favicon_url,
                "primary_color": settings.primary_color,
                "accent_color": settings.accent_color,
                # Banner
                "banner_enabled": settings.banner_enabled,
                "banner_text": settings.banner_text,
                "banner_link": settings.banner_link,
                # Social links
                "google_review_url": settings.google_review_url,
                "yelp_url": settings.yelp_url,
                "facebook_url": settings.facebook_url,
                "instagram_url": settings.instagram_url,
                # SEO
                "seo": {
                    "address_locality": settings.address_locality,
                    "address_region": settings.address_region,
                    "postal_code": settings.postal_code,
                    "country": settings.country,
                    "price_range": settings.price_range,
                },
                "nav": formatted_nav,
            }
        )
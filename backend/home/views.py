from django.http import JsonResponse
from django.views import View
from wagtail_headless_preview.models import PagePreview

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from wagtail.models import Site
from .models import SiteSettings


class PagePreviewAPIView(View):
    """Return stored preview data as JSON given a valid token."""

    def get(self, request, token):
        try:
            preview = PagePreview.objects.get(token=token)
        except PagePreview.DoesNotExist:
            return JsonResponse({"error": "Invalid or expired preview token"}, status=404)

        return JsonResponse(preview.content_json, safe=False)


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
        return Response(
            {
                "site_name": settings.site_name,
                "tagline": settings.tagline,
                "phone_number": settings.phone_number,
                "contact_email": settings.contact_email,
                "seo": {
                    "address_locality": settings.address_locality,
                    "address_region": settings.address_region,
                    "postal_code": settings.postal_code,
                    "country": settings.country,
                    "price_range": settings.price_range,
                },
                "nav": [
                    {"label": "Services", "href": "#services"},
                    {"label": "Our Work", "href": "#portfolio"},
                    {"label": "Contact", "href": "#lead-form"},
                ],
            }
        )
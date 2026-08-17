"""Site settings and headless preview API views."""

from django.http import JsonResponse
from django.views import View
from wagtail_headless_preview.models import PagePreview

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from wagtail.models import Site
from core.utils import resolve_image_url
from home.models import HomePage
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
        from site_settings.serializers import SiteSettingsSerializer

        current_site = Site.find_for_request(request) or Site.objects.filter(is_default_site=True).first()
        if not current_site:
            return Response({"error": "Site not configured"}, status=status.HTTP_404_NOT_FOUND)

        settings = SiteSettings.for_site(current_site)
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)

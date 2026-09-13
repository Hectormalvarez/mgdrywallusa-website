"""Site settings and headless preview API views."""

from django.http import JsonResponse
from django.views import View
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from wagtail.models import Site
from wagtail_headless_preview.models import PagePreview

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


class SettingsPreviewRateThrottle(AnonRateThrottle):
    """Throttle for the public, token-gated settings preview fetch."""

    scope = "settings_preview"


class SettingsPreviewTokenAPIView(APIView):
    """
    GET /api/v1/settings-preview/<token>/
    Returns the serialized *unsaved* settings payload stored behind a
    preview token (US-006). Tokens are unguessable and expire after
    ``SettingsPreview.TTL_HOURS``; unknown/expired tokens 404.
    """

    throttle_classes = [SettingsPreviewRateThrottle]

    def get(self, request, token):
        from site_settings.models import SettingsPreview

        preview = SettingsPreview.get_valid(token)
        if preview is None:
            return Response(
                {"error": "Invalid or expired preview token"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(preview.payload)


class SettingsPreviewCreateView(View):
    """
    POST /admin/settings-preview/ (Wagtail admin session required)

    Receives the Site Settings edit form as currently filled in (unsaved),
    validates it exactly as a save would, stores the serialized result behind
    a transient token, and returns the frontend draft-preview URL (US-006).
    Previewing never writes to the live settings.
    """

    def post(self, request, *args, **kwargs):
        import json

        from django.conf import settings as django_settings
        from django.contrib import messages

        from site_settings.services import build_settings_preview_payload

        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=403)

        site = Site.find_for_request(request) or Site.objects.filter(is_default_site=True).first()
        if site is None:
            return JsonResponse({"error": "Site not configured"}, status=400)

        policy = SiteSettings.get_permission_policy()
        if not policy.user_has_permission_for_instance(request.user, "change", site):
            return JsonResponse({"error": "Permission denied"}, status=403)

        if request.content_type and "json" in request.content_type:
            try:
                data = json.loads(request.body or b"{}")
            except (ValueError, UnicodeDecodeError):
                return JsonResponse({"error": "Invalid JSON body"}, status=400)
            files = None
        else:
            data = request.POST
            files = request.FILES

        payload, errors = build_settings_preview_payload(site, data, files)
        if errors:
            return JsonResponse({"errors": errors}, status=400)

        from site_settings.models import SettingsPreview

        record = SettingsPreview.store(site, payload)
        # FRONTEND_URL is the bare public origin; WAGTAIL_PREVIEW_URL already
        # contains the /api/preview path, so it must not be appended again.
        preview_url = django_settings.FRONTEND_URL.rstrip("/") + f"/api/preview?settings_token={record.token}"
        messages.info(request, "Preview opened in a new tab. Nothing has been published.")
        return JsonResponse({"url": preview_url})

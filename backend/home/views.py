from django.http import JsonResponse
from django.views import View
from wagtail_headless_preview.models import PagePreview


class PagePreviewAPIView(View):
    """Return stored preview data as JSON given a valid token."""

    def get(self, request, token):
        try:
            preview = PagePreview.objects.get(token=token)
        except PagePreview.DoesNotExist:
            return JsonResponse({"error": "Invalid or expired preview token"}, status=404)

        return JsonResponse(preview.content_json, safe=False)
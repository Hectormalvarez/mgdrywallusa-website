"""Lead ingestion API view."""

import logging

from rest_framework import parsers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from leads.models import Lead
from leads.serializers import LeadSerializer
from leads.services import StorageService, notify_lead_created

logger = logging.getLogger(__name__)


class LeadCreateView(APIView):
    """
    POST /api/v1/leads/

    Accepts multipart/form-data with fields:
      - name, phone, email, project_tier (required)
      - details (optional)
      - photos (repeated file field, max 3, max 10 MB each, 10 MB total)
      - company (honeypot — silent drop if non-empty)
    """

    parser_classes = [parsers.MultiPartParser]

    def post(self, request, *args, **kwargs):
        # --- Honeypot: silent 201 drop, no lead created ---
        company = request.POST.get("company", "")
        if company:
            return Response(
                {"status": "created", "id": None},
                status=status.HTTP_201_CREATED,
            )

        serializer = LeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # --- Create lead ---
        lead = Lead.objects.create(
            name=data["name"],
            phone=data["phone"],
            email=data["email"],
            project_tier=data["project_tier"],
            details=data.get("details", ""),
        )

        # --- Persist photos via storage service ---
        photos = data.get("photos", [])
        if photos:
            StorageService.store_photos(lead, photos)

        # --- Fire async notification ---
        notify_lead_created(lead)

        return Response(
            {"status": "created", "id": lead.pk},
            status=status.HTTP_201_CREATED,
        )

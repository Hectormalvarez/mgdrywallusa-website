"""Lead ingestion API view."""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from leads.models import Lead, LeadAttachment, TIER_CHOICES

logger = logging.getLogger(__name__)

MAX_FILES = 3
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

VALID_TIERS = {choice[0] for choice in TIER_CHOICES}


def _notify_lead_created(lead: Lead) -> None:
    """Send an email notification about a new lead."""
    recipient_list = getattr(settings, "LEAD_NOTIFICATION_EMAILS", [])
    if not recipient_list:
        logger.info("No LEAD_NOTIFICATION_EMAILS configured; skipping notification.")
        return

    subject = f"New Lead: {lead.name} - {lead.get_project_tier_display()}"
    body = (
        f"A new lead has been submitted.\n\n"
        f"Name: {lead.name}\n"
        f"Phone: {lead.phone}\n"
        f"Email: {lead.email}\n"
        f"Project Tier: {lead.get_project_tier_display()}\n"
        f"Details: {lead.details}\n"
        f"Submitted: {lead.submitted_at}\n"
        f"Attachments: {lead.attachments.count()}\n"
    )
    send_mail(
        subject=subject,
        message=body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com"),
        recipient_list=recipient_list,
    )


@method_decorator(csrf_exempt, name="dispatch")
class LeadCreateView(View):
    """
    POST /api/v1/leads/

    Accepts multipart/form-data with fields:
      - name, phone, email, project_tier (required)
      - details (optional)
      - photos (repeated file field, max 3, max 10MB each)
      - company (honeypot - silent drop if non-empty)
    """

    def post(self, request, *args, **kwargs):
        # --- Honeypot check FIRST (silent drop) ---
        company = request.POST.get("company", "")
        if company:
            return JsonResponse({"status": "created", "id": None}, status=201)

        # --- Validate required fields ---
        errors = {}
        name = request.POST.get("name", "").strip()
        phone = request.POST.get("phone", "").strip()
        email = request.POST.get("email", "").strip()
        project_tier = request.POST.get("project_tier", "").strip()
        details = request.POST.get("details", "").strip()

        if not name:
            errors.setdefault("name", []).append("Name is required.")
        if not phone:
            errors.setdefault("phone", []).append("Phone is required.")
        if not email:
            errors.setdefault("email", []).append("Email is required.")
        if not project_tier:
            errors.setdefault("project_tier", []).append("Project tier is required.")
        elif project_tier not in VALID_TIERS:
            errors.setdefault("project_tier", []).append(
                f"Invalid tier '{project_tier}'. Choose from: {', '.join(VALID_TIERS)}."
            )

        # --- Validate files ---
        photos = request.FILES.getlist("photos")
        if len(photos) > MAX_FILES:
            errors.setdefault("photos", []).append(
                f"No more than {MAX_FILES} files allowed."
            )
        for photo in photos:
            if photo.size > MAX_FILE_SIZE:
                errors.setdefault("photos", []).append(
                    f"'{photo.name}' exceeds the 10MB limit."
                )

        if errors:
            return JsonResponse({"errors": errors}, status=400)

        # --- Create Lead and Attachments ---
        lead = Lead.objects.create(
            name=name,
            phone=phone,
            email=email,
            project_tier=project_tier,
            details=details,
        )

        for photo in photos:
            LeadAttachment.objects.create(lead=lead, file=photo)

        # --- Fire notification ---
        _notify_lead_created(lead)

        return JsonResponse({"status": "created", "id": lead.pk}, status=201)

    def get(self, request, *args, **kwargs):
        return JsonResponse(
            {"detail": "Method not allowed."}, status=405
        )

"""Tests for the leads app: models, API endpoint, and admin registration."""

import io

import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.test import Client

from leads.models import Lead, LeadAttachment

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

LEAD_URL = "/api/v1/leads/"


def _make_photo(name="photo.jpg", size=1024, content_type="image/jpeg"):
    """Return an InMemoryUploadedFile of the given size bytes."""
    buf = io.BytesIO(b"\x00" * size)
    return InMemoryUploadedFile(buf, None, name, content_type, size, None)


def _valid_payload(photos=None, **overrides):
    """Build a dict of multipart form data with sensible defaults."""
    data = {
        "name": "Jane Doe",
        "phone": "555-1234",
        "email": "jane@example.com",
        "project_tier": "repair",
        "details": "Need drywall patch",
    }
    data.update(overrides)
    if photos is not None:
        data["photos"] = photos
    return data


# ===================================================================
# MODEL TESTS
# ===================================================================


@pytest.mark.django_db
class TestLeadModel:
    """Unit tests for the Lead model."""

    def test_create_lead_with_valid_data(self):
        lead = Lead.objects.create(
            name="Jane Doe",
            phone="555-1234",
            email="jane@example.com",
            project_tier="repair",
            details="Patch a hole",
        )
        assert lead.pk is not None
        assert lead.name == "Jane Doe"
        assert lead.submitted_at is not None

    def test_str_representation(self):
        lead = Lead.objects.create(
            name="Bob Builder",
            phone="555-0000",
            email="bob@example.com",
            project_tier="adu",
        )
        assert str(lead) == "Bob Builder"

    def test_details_is_optional(self):
        lead = Lead.objects.create(
            name="No Details",
            phone="555-0001",
            email="nd@example.com",
            project_tier="single_room",
        )
        assert lead.details == ""

    def test_invalid_project_tier_rejected(self):
        lead = Lead(
            name="Bad Tier",
            phone="555-0002",
            email="bad@example.com",
            project_tier="invalid_choice",
        )
        with pytest.raises(ValidationError) as exc_info:
            lead.full_clean()
        assert "project_tier" in exc_info.value.message_dict

    def test_missing_required_fields(self):
        lead = Lead(project_tier="repair")
        with pytest.raises(ValidationError) as exc_info:
            lead.full_clean()
        errors = exc_info.value.message_dict
        assert "name" in errors
        assert "phone" in errors
        assert "email" in errors

    def test_valid_tier_choices(self):
        for tier in ("repair", "single_room", "adu"):
            lead = Lead(
                name=f"Tier {tier}",
                phone="555-0003",
                email=f"{tier}@example.com",
                project_tier=tier,
            )
            lead.full_clean()


@pytest.mark.django_db
class TestLeadAttachmentModel:
    """Unit tests for the LeadAttachment model and its FK relationship."""

    def _create_lead(self):
        return Lead.objects.create(
            name="Att Tester",
            phone="555-1111",
            email="att@example.com",
            project_tier="repair",
        )

    def test_attachment_links_to_lead(self):
        lead = self._create_lead()
        att = LeadAttachment.objects.create(lead=lead, file=_make_photo())
        assert att.lead_id == lead.pk
        assert lead.attachments.count() == 1

    def test_multiple_attachments(self):
        lead = self._create_lead()
        for i in range(3):
            LeadAttachment.objects.create(lead=lead, file=_make_photo(name=f"p{i}.jpg"))
        assert lead.attachments.count() == 3

    def test_cascade_delete(self):
        lead = self._create_lead()
        LeadAttachment.objects.create(lead=lead, file=_make_photo())
        lead_pk = lead.pk
        lead.delete()
        assert LeadAttachment.objects.filter(lead_id=lead_pk).count() == 0


# ===================================================================
# API ENDPOINT TESTS
# ===================================================================


@pytest.mark.django_db
class TestLeadCreateEndpoint:
    """Tests for POST /api/v1/leads/."""

    def test_valid_submission_returns_201(self):
        client = Client()
        photos = [_make_photo()]
        data = _valid_payload(photos=photos)
        resp = client.post(LEAD_URL, data)
        assert resp.status_code == 201
        body = resp.json()
        assert body["status"] == "created"
        assert "id" in body
        assert Lead.objects.count() == 1

    def test_valid_submission_creates_attachment(self):
        client = Client()
        photos = [_make_photo()]
        resp = client.post(LEAD_URL, _valid_payload(photos=photos))
        lead = Lead.objects.get(pk=resp.json()["id"])
        assert lead.attachments.count() == 1

    def test_valid_submission_no_photos(self):
        client = Client()
        resp = client.post(LEAD_URL, _valid_payload())
        assert resp.status_code == 201
        lead = Lead.objects.first()
        assert lead.attachments.count() == 0

    def test_valid_submission_multiple_photos(self):
        client = Client()
        photos = [_make_photo(name=f"p{i}.jpg") for i in range(3)]
        resp = client.post(LEAD_URL, _valid_payload(photos=photos))
        assert resp.status_code == 201
        lead = Lead.objects.get(pk=resp.json()["id"])
        assert lead.attachments.count() == 3

    # ---- Honeypot ---------------------------------------------------------

    def test_honeypot_returns_201_but_does_not_persist(self):
        client = Client()
        data = _valid_payload()
        data["company"] = "spammer-inc"
        resp = client.post(LEAD_URL, data)
        assert resp.status_code == 201
        assert Lead.objects.count() == 0

    def test_honeypot_empty_is_not_dropped(self):
        client = Client()
        data = _valid_payload()
        data["company"] = ""
        resp = client.post(LEAD_URL, data)
        assert resp.status_code == 201
        assert Lead.objects.count() == 1

    # ---- Validation errors ------------------------------------------------

    def test_missing_name_returns_400(self):
        client = Client()
        resp = client.post(LEAD_URL, _valid_payload(name=""))
        assert resp.status_code == 400
        assert "name" in resp.json()["errors"]

    def test_missing_phone_returns_400(self):
        client = Client()
        resp = client.post(LEAD_URL, _valid_payload(phone=""))
        assert resp.status_code == 400
        assert "phone" in resp.json()["errors"]

    def test_missing_email_returns_400(self):
        client = Client()
        resp = client.post(LEAD_URL, _valid_payload(email=""))
        assert resp.status_code == 400
        assert "email" in resp.json()["errors"]

    def test_missing_project_tier_returns_400(self):
        client = Client()
        resp = client.post(LEAD_URL, _valid_payload(project_tier=""))
        assert resp.status_code == 400
        assert "project_tier" in resp.json()["errors"]

    def test_invalid_project_tier_returns_400(self):
        client = Client()
        resp = client.post(LEAD_URL, _valid_payload(project_tier="kitchen_remodel"))
        assert resp.status_code == 400
        assert "project_tier" in resp.json()["errors"]

    def test_too_many_files_returns_400(self):
        client = Client()
        photos = [_make_photo(name=f"p{i}.jpg") for i in range(4)]
        resp = client.post(LEAD_URL, _valid_payload(photos=photos))
        assert resp.status_code == 400
        assert "photos" in resp.json()["errors"]

    def test_oversized_file_returns_400(self):
        client = Client()
        ten_mb_plus_one = 10 * 1024 * 1024 + 1
        photos = [_make_photo(size=ten_mb_plus_one)]
        resp = client.post(LEAD_URL, _valid_payload(photos=photos))
        assert resp.status_code == 400
        assert "photos" in resp.json()["errors"]

    def test_honeypot_skips_validation(self):
        client = Client()
        data = _valid_payload(name="", email="")
        data["company"] = "bot"
        resp = client.post(LEAD_URL, data)
        assert resp.status_code == 201
        assert Lead.objects.count() == 0

    # ---- Notification email -----------------------------------------------

    def test_email_notification_sent_on_valid_submission(self, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
        settings.LEAD_NOTIFICATION_EMAILS = ["owner@example.com"]
        settings.DEFAULT_FROM_EMAIL = "noreply@example.com"

        from django.core import mail

        mail.outbox = []

        client = Client()
        resp = client.post(LEAD_URL, _valid_payload())
        assert resp.status_code == 201
        assert len(mail.outbox) == 1
        msg = mail.outbox[0]
        assert "owner@example.com" in msg.to
        assert "Jane Doe" in msg.body

    def test_no_email_sent_on_honeypot(self, settings):
        settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
        settings.LEAD_NOTIFICATION_EMAILS = ["owner@example.com"]

        from django.core import mail

        mail.outbox = []

        client = Client()
        data = _valid_payload()
        data["company"] = "spammer"
        resp = client.post(LEAD_URL, data)
        assert resp.status_code == 201
        assert len(mail.outbox) == 0

    def test_get_returns_405(self):
        client = Client()
        resp = client.get(LEAD_URL)
        assert resp.status_code == 405


# ===================================================================
# ADMIN REGISTRATION TEST
# ===================================================================


@pytest.mark.django_db
class TestLeadAdminRegistration:
    """Verify that the Lead model is registered as a Wagtail snippet."""

    def test_lead_is_registered_snippet(self):
        from wagtail.snippets.models import SNIPPET_MODELS

        registered = [m for m in SNIPPET_MODELS if m.__name__ == "Lead"]
        assert len(registered) == 1, (
            f"Lead not found in Wagtail SNIPPET_MODELS; got {registered}"
        )

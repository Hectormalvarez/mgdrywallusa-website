"""factory_boy factories for test data generation."""

import io

import factory
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image as PILImage
from wagtail.images.models import Image

from leads.models import Lead


class LeadFactory(factory.django.DjangoModelFactory):
    """Factory for creating Lead instances."""

    class Meta:
        model = Lead

    name = factory.Faker("name")
    phone = "555-123-4567"
    email = factory.Faker("email")
    project_tier = "repair"
    details = ""


class LeadAttachmentFactory(factory.django.DjangoModelFactory):
    """Factory for creating LeadAttachment instances."""

    class Meta:
        model = "leads.LeadAttachment"

    file = factory.LazyAttribute(
        lambda _: InMemoryUploadedFile(
            io.BytesIO(b"\x00" * 1024),
            None,
            "photo.jpg",
            "image/jpeg",
            1024,
            None,
        )
    )


class WagtailImageFactory(factory.django.DjangoModelFactory):
    """Factory for creating Wagtail Image instances."""

    class Meta:
        model = Image

    title = "Factory Image"

    @factory.lazy_attribute
    def file(self):
        pil_img = PILImage.new("RGB", (100, 100), color="blue")
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        buf.seek(0)
        return InMemoryUploadedFile(
            buf,
            "image",
            "factory.png",
            "image/png",
            buf.getbuffer().nbytes,
            None,
        )

from django.db import models


TIER_CHOICES = [
    ("repair", "Repair"),
    ("single_room", "Single Room"),
    ("adu", "ADU"),
]


STATUS_CHOICES = [
    ("new", "New"),
    ("contacted", "Contacted"),
    ("closed", "Closed"),
]


class Lead(models.Model):
    """A customer lead submitted via the public intake form."""

    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField()
    project_tier = models.CharField(max_length=20, choices=TIER_CHOICES)
    details = models.TextField(blank=True, default="")
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="new",
    )

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return self.name


class LeadAttachment(models.Model):
    """A file uploaded alongside a Lead submission."""

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to="leads/%Y/%m/")

    def __str__(self):
        return f"Attachment for {self.lead.name}"
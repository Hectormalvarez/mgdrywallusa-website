"""Admin configuration for Lead model."""

from wagtail.snippets.views.snippets import SnippetViewSet
from leads.models import Lead


class LeadSnippetViewSet(SnippetViewSet):
    model = Lead
    menu_label = "Leads"
    menu_order = 300
    icon = "mail"
    list_display = ["name", "email", "phone", "project_tier", "submitted_at"]
    search_fields = ["name", "email", "phone"]
    list_filter = ["project_tier", "submitted_at"]

"""Wagtail admin configuration for the home app."""

from wagtail.snippets.views.snippets import SnippetViewSet

from home.models import Service


class ServiceViewSet(SnippetViewSet):
    model = Service
    icon = "cog"
    menu_label = "Services"
    menu_order = 200
    list_display = ["name", "icon", "is_active"]
    list_filter = ["is_active", "icon"]
    search_fields = ["name", "short_description"]

"""Wagtail admin hooks for the home app."""

from django.urls import reverse
from wagtail import hooks
from wagtail.admin.menu import MenuItem


@hooks.register("register_admin_menu_item")
def register_services_menu_item():
    """Add a top-level Services link to the sidebar."""
    return MenuItem(
        "Services",
        reverse("wagtailsnippets_home_service:list"),
        icon_name="list-ul",
        order=400,
    )
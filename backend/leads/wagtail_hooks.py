"""Wagtail admin hooks for the leads app."""

from django.urls import reverse
from wagtail import hooks
from wagtail.admin.menu import MenuItem


@hooks.register("register_admin_menu_item")
def register_leads_menu_item():
    """Add a top-level Leads link to the sidebar."""
    return MenuItem(
        "Leads",
        reverse("wagtailsnippets_leads_lead:list"),
        icon_name="mail",
        order=300,
    )
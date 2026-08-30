"""Wagtail admin hooks for the portfolio app."""

from django.urls import reverse
from wagtail import hooks
from wagtail.admin.menu import MenuItem


@hooks.register("register_admin_menu_item")
def register_portfolio_menu_item():
    """Add a top-level Portfolio shortcut linking to the page explorer."""
    from portfolio.models import PortfolioPage

    portfolio_page = PortfolioPage.objects.first()
    if portfolio_page:
        url = reverse("wagtailadmin_explore", args=[portfolio_page.id])
    else:
        url = reverse("wagtailadmin_explore_root")

    return MenuItem(
        "Portfolio",
        url,
        icon_name="image",
        order=250,
    )

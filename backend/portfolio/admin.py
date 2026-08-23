"""Wagtail admin viewset for managing portfolio items as a flat listing."""

from wagtail.admin.ui.tables import Column
from wagtail.admin.viewsets.pages import PageListingViewSet

from portfolio.models import PortfolioItem
from portfolio.tables import ImageThumbnailColumn


class PortfolioItemViewSet(PageListingViewSet):
    model = PortfolioItem
    icon = "image"
    menu_label = "Portfolio"
    add_to_admin_menu = True
    menu_order = 500

    columns = [
        ImageThumbnailColumn("thumbnail", label="Preview"),
        Column("title", label="Title", sort_key="title"),
        Column("scope", label="Scope", sort_key="scope"),
        Column("live", label="Live", sort_key="live"),
    ]

    list_filter = ["scope", "live"]
    search_fields = ["title", "description"]
    ordering = ["-latest_revision_created_at"]


portfolio_item_viewset = PortfolioItemViewSet("portfolio_items")

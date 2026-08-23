"""Wagtail admin hooks for the portfolio app."""

from wagtail import hooks


@hooks.register("register_admin_viewset")
def register_portfolio_viewset():
    """Register the flat listing viewset for portfolio items."""
    from portfolio.admin import portfolio_item_viewset

    return portfolio_item_viewset

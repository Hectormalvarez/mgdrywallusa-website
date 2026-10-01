import pytest

from portfolio.models import PortfolioItem, PortfolioPage


@pytest.mark.django_db
def test_portfolio_pages_disable_django_side_preview():
    """Headless site: portfolio pages must not offer the classic Preview.

    Rendering `portfolio/portfolio_item.html` server-side 500s with
    TemplateDoesNotExist (found by the US-005 owner walkthrough) — Django
    has no page templates; visitors see changes live after publish.
    """
    assert PortfolioItem.preview_modes == []
    assert PortfolioPage.preview_modes == []

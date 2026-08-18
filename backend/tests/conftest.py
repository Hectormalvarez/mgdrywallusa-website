"""Shared pytest fixtures for the Wagtail/Django backend."""

import io
from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image as PILImage
from wagtail.images.models import Image
from wagtail.models import Page, Site


@pytest.fixture(autouse=True)
def _disable_throttling():
    """Disable DRF throttling for all tests to avoid 429s."""
    with patch("rest_framework.throttling.AnonRateThrottle.allow_request", return_value=True):
        yield


@pytest.fixture
def root_page(db):
    """Return the Wagtail root page."""
    return Page.get_first_root_node()


@pytest.fixture
def home_page(db, root_page):
    """Create and return a HomePage under the root."""
    from home.models import HomePage

    page = HomePage(title="Test Home", slug="test-home")
    root_page.add_child(instance=page)
    return page


@pytest.fixture
def site(db, home_page):
    """Create or update the default Wagtail site pointing at home_page."""
    site_obj, _ = Site.objects.get_or_create(
        hostname="localhost",
        defaults={
            "root_page": home_page,
            "is_default_site": True,
        },
    )
    if site_obj.root_page != home_page:
        site_obj.root_page = home_page
        site_obj.save()
    return site_obj


@pytest.fixture
def test_image(db):
    """Create a minimal valid 100x100 PNG image."""
    pil_img = PILImage.new("RGB", (100, 100), color="red")
    buffer = io.BytesIO()
    pil_img.save(buffer, format="PNG")
    buffer.seek(0)
    return Image.objects.create(
        title="Test Image",
        file=InMemoryUploadedFile(
            buffer,
            "image",
            "test.png",
            "image/png",
            buffer.getbuffer().nbytes,
            None,
        ),
    )


@pytest.fixture
def portfolio_item(db, home_page, test_image, site):
    """Create a sample PortfolioItem under home_page.

    Requires the ``site`` fixture so the Wagtail API can resolve the page tree.
    """
    from portfolio.models import PortfolioItem, PortfolioItemImage

    item = PortfolioItem(
        title="Test Portfolio Item",
        description="This is a test portfolio item.",
        slug="test-portfolio-item",
        scope="residential",
        featured_image=test_image,
    )
    home_page.add_child(instance=item)
    item.finish_tags.add("smooth", "level-5")
    PortfolioItemImage.objects.create(
        page=item,
        image=test_image,
        sort_order=0,
    )
    # Persist django-modelcluster tag changes by saving the parent page again.
    item.save()
    return item


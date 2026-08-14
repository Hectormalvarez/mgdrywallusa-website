"""Tests for the portfolio API endpoint."""
import io
import pytest
from django.test import Client
from django.core.files.uploadedfile import InMemoryUploadedFile
from wagtail.models import Page, Site
from wagtail.images.models import Image
from PIL import Image as PILImage


def _create_test_image():
    """Create a minimal valid PNG image for testing."""
    image = PILImage.new('RGB', (100, 100), color='red')
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    buffer.seek(0)
    return InMemoryUploadedFile(
        buffer,
        'image',
        'test.png',
        'image/png',
        buffer.getbuffer().nbytes,
        None,
    )


@pytest.mark.django_db
def test_portfolio_api_returns_items():
    """Test that the portfolio API endpoint returns portfolio items."""
    # Create the root page hierarchy
    root_page = Page.get_first_root_node()
    
    # Create home page with unique slug
    home_page = Page(title='Portfolio Home', slug='portfolio-home-test')
    root_page.add_child(instance=home_page)
    
    # Create default site (use get_or_create to avoid conflicts)
    site, _ = Site.objects.get_or_create(
        hostname='localhost',
        defaults={
            'root_page': home_page,
            'is_default_site': True,
        }
    )
    if site.root_page != home_page:
        site.root_page = home_page
        site.save()
    
    # Create a test image (valid PNG)
    image_file = _create_test_image()
    image = Image.objects.create(
        title='Test Image',
        file=image_file,
    )
    
    # Import and create a portfolio item
    from portfolio.models import PortfolioItem
    
    portfolio_item = PortfolioItem(
        title='Test Portfolio Item',
        description='This is a test portfolio item.',
        slug='test-portfolio-item',
        image=image,
    )
    home_page.add_child(instance=portfolio_item)
    
    # Test the API endpoint
    client = Client()
    response = client.get('/api/v1/pages/?type=portfolio.PortfolioItem&fields=*')
    
    assert response.status_code == 200
    data = response.json()
    
    assert data['meta']['total_count'] == 1
    item = data['items'][0]
    assert item['title'] == 'Test Portfolio Item'
    assert item['description'] == 'This is a test portfolio item.'
    assert 'image_url' in item
    assert item['image_url'] is not None




"""Tests for the portfolio API endpoint."""

import pytest
from django.test import Client


@pytest.mark.django_db
def test_portfolio_api_returns_items(portfolio_item):
    """Test that the portfolio API endpoint returns portfolio items with renditions."""
    client = Client()
    response = client.get("/api/v1/pages/?type=portfolio.PortfolioItem&fields=*")

    assert response.status_code == 200
    data = response.json()

    assert data["meta"]["total_count"] == 1
    item = data["items"][0]
    assert item["title"] == "Test Portfolio Item"
    assert item["description"] == "This is a test portfolio item."
    assert item["scope"] == "residential"
    assert item["scope_label"] == "Residential"
    assert sorted(item["finish_tags"]) == ["level-5", "smooth"]

    # featured_image is now a rendition dict
    featured = item["featured_image"]
    assert featured is not None
    assert "thumbnail" in featured
    assert "card" in featured
    assert "full" in featured
    assert "alt" in featured

    # gallery_images is now a list of {id, image, caption}
    gallery = item["gallery_images"]
    assert isinstance(gallery, list)
    assert len(gallery) == 1
    assert "image" in gallery[0]
    assert "caption" in gallery[0]
    assert gallery[0]["image"]["alt"] is not None


@pytest.mark.django_db
def test_sort_order_in_api_response(portfolio_item):
    """Test that the API exposes sort_order for each portfolio item."""
    client = Client()
    response = client.get("/api/v1/pages/?type=portfolio.PortfolioItem&fields=*")

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert "sort_order" in item
    assert item["sort_order"] == 0


@pytest.mark.django_db
def test_portfolio_detail_by_slug(portfolio_item):
    """Test fetching a single portfolio item by slug."""
    client = Client()
    response = client.get(
        "/api/v1/pages/?type=portfolio.PortfolioItem&fields=*"
        "&slug=test-portfolio-item"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["meta"]["total_count"] == 1
    assert data["items"][0]["title"] == "Test Portfolio Item"
    assert data["items"][0]["meta"]["slug"] == "test-portfolio-item"


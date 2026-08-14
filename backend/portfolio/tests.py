"""Tests for the portfolio API endpoint."""

import pytest
from django.test import Client


@pytest.mark.django_db
def test_portfolio_api_returns_items(portfolio_item):
    """Test that the portfolio API endpoint returns portfolio items."""
    client = Client()
    response = client.get("/api/v1/pages/?type=portfolio.PortfolioItem&fields=*")

    assert response.status_code == 200
    data = response.json()

    assert data["meta"]["total_count"] == 1
    item = data["items"][0]
    assert item["title"] == "Test Portfolio Item"
    assert item["description"] == "This is a test portfolio item."
    assert "image_url" in item
    assert item["image_url"] is not None


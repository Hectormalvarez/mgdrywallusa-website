"""Tests for the portfolio serializers."""

import pytest

from portfolio.serializers import GalleryImageField, OptimizedPortfolioImageField, TagsField


@pytest.mark.django_db
def test_tags_field_returns_string_list(portfolio_item):
    """TagsField should return a flat list of tag names."""
    field = TagsField()
    result = field.to_representation(portfolio_item.finish_tags)
    assert isinstance(result, list)
    assert all(isinstance(tag, str) for tag in result)
    assert "smooth" in result
    assert "level-5" in result


@pytest.mark.django_db
def test_optimized_image_field_returns_renditions(test_image):
    """OptimizedPortfolioImageField should return thumbnail, card, full, alt."""
    field = OptimizedPortfolioImageField()
    result = field.to_representation(test_image)
    assert result is not None
    assert "thumbnail" in result
    assert "card" in result
    assert "full" in result
    assert "alt" in result
    assert isinstance(result["thumbnail"], str)
    assert isinstance(result["card"], str)
    assert isinstance(result["full"], str)


@pytest.mark.django_db
def test_optimized_image_field_returns_none_for_empty():
    """OptimizedPortfolioImageField should return None for null images."""
    field = OptimizedPortfolioImageField()
    result = field.to_representation(None)
    assert result is None


@pytest.mark.django_db
def test_gallery_image_field_returns_list(portfolio_item):
    """GalleryImageField should return a list of gallery item dicts."""
    field = GalleryImageField()
    result = field.to_representation(portfolio_item.gallery_images)
    assert isinstance(result, list)
    assert len(result) == 1
    item = result[0]
    assert "id" in item
    assert "image" in item
    assert "caption" in item
    assert isinstance(item["image"], dict)
    assert "thumbnail" in item["image"]
    assert "card" in item["image"]
    assert "full" in item["image"]
    assert "alt" in item["image"]

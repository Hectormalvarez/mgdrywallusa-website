"""Tests for Wagtail admin field configuration.

Ensures every content-editable model field has descriptive help_text
so editors know what to enter without developer guidance.
"""

import pytest

from home.models import HomePage, Service
from portfolio.models import PortfolioItem, PortfolioItemImage


@pytest.mark.parametrize(
    "model_cls,field_name,expected_substring",
    [
        # ── HomePage hero fields ─────────────────────────────────────────
        (HomePage, "hero_kicker", "short label"),
        (HomePage, "hero_heading", "headline"),
        (HomePage, "hero_subheading", "supporting text"),
        (HomePage, "hero_image", "1920"),
        # ── HomePage CTA fields ──────────────────────────────────────────
        (HomePage, "cta_primary_label", "primary action button"),
        (HomePage, "cta_primary_url", "url"),
        (HomePage, "cta_secondary_label", "secondary action button"),
        (HomePage, "cta_secondary_url", "url"),
        # ── Service snippet fields ───────────────────────────────────────
        (Service, "name", "service name"),
        (Service, "short_description", "service description"),
        (Service, "icon", "shield"),
        (Service, "is_active", "hide"),
        (Service, "slug", "identifier"),
        # ── PortfolioItem fields ─────────────────────────────────────────
        (PortfolioItem, "description", "project summary"),
        (PortfolioItem, "featured_image", "800"),
        # ── PortfolioItemImage fields ────────────────────────────────────
        (PortfolioItemImage, "caption", "caption"),
    ],
)
def test_field_has_help_text(model_cls, field_name, expected_substring):
    """Every content field must have help_text guiding the editor."""
    field = model_cls._meta.get_field(field_name)
    assert field.help_text, (
        f"{model_cls.__name__}.{field_name} is missing help_text"
    )
    assert expected_substring.lower() in field.help_text.lower(), (
        f"{model_cls.__name__}.{field_name} help_text should mention "
        f"'{expected_substring}' — got: {field.help_text}"
    )


def test_icon_help_text_lists_valid_values():
    """icon help_text must list exactly the values the frontend supports."""
    field = Service._meta.get_field("icon")
    for valid_icon in ("wall", "patch", "paint", "shield"):
        assert valid_icon in field.help_text, (
            f"icon help_text must list '{valid_icon}' as a valid value"
        )
    # "building" was previously listed but is NOT a supported frontend icon
    assert "building" not in field.help_text, (
        "icon help_text must not list 'building' — it is not a valid icon"
    )

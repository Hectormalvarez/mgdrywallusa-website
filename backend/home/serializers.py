"""Serializers for home page API fields."""

from rest_framework.fields import Field


class FeaturedServicesField(Field):
    """Serializes HomePageFeaturedService orderables into active service data."""

    def to_representation(self, relation):
        return [
            {
                "name": item.service.name,
                "slug": item.service.slug,
                "short_description": item.service.short_description,
                "icon": item.service.icon,
            }
            for item in relation.all()
            if item.service.is_active
        ]


class ChromeNavigationField(Field):
    """Serializes HomePageNavigationItem orderables into the frontend nav contract.

    Iterates the cluster manager (``.all()``) so *unsaved* in-memory children —
    the live preview's draft rows — serialize identically to saved ones.  An
    empty navigation falls back to the site defaults, matching the behaviour
    the settings endpoint used to provide on fresh databases.
    """

    DEFAULTS = [
        {"label": "Services", "href": "#services"},
        {"label": "Our Work", "href": "#portfolio"},
        {"label": "Contact", "href": "#lead-form"},
    ]

    def to_representation(self, relation):
        items = [{"label": item.label, "href": item.url} for item in relation.all()]
        return items or self.DEFAULTS

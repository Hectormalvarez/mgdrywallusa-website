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

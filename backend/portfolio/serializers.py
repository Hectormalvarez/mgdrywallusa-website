from rest_framework.fields import Field


class TagsField(Field):
    def to_representation(self, tags):
        return [tag.name for tag in tags.all()]


def _rendition_dict(image):
    """Return a dict of pre-generated rendition URLs for an image."""
    return {
        "thumbnail": image.get_rendition("fill-150x150").url,
        "card": image.get_rendition("fill-800x600").url,
        "full": image.get_rendition("max-1600x1200").url,
        "alt": image.title,
    }


class OptimizedPortfolioImageField(Field):
    """Serialize a Wagtail Image as {thumbnail, card, full, alt}."""

    def to_representation(self, image):
        if not image:
            return None
        return _rendition_dict(image)


class GalleryImageField(Field):
    """Serialize gallery orderables as a list of {id, image: {...}, caption}."""

    def to_representation(self, relation):
        results = []
        for item in relation.all():
            if not item.image:
                continue
            results.append(
                {
                    "id": item.id,
                    "image": _rendition_dict(item.image),
                    "caption": item.caption,
                }
            )
        return results

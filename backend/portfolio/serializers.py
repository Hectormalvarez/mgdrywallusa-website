from rest_framework.fields import Field
from wagtail.images.api.fields import ImageRenditionField


class TagsField(Field):
    def to_representation(self, tags):
        return [tag.name for tag in tags.all()]


class FeaturedImageField(Field):
    def __init__(self, filter_spec, **kwargs):
        self.filter_spec = filter_spec
        super().__init__(**kwargs)

    def to_representation(self, image):
        request = self.context.get("request")
        if not image:
            return None
        data = ImageRenditionField(self.filter_spec).to_representation(image)
        url = data.get("url")
        if request and url and url.startswith("/"):
            return request.build_absolute_uri(url)
        return data.get("full_url") or url


class GalleryImageField(Field):
    def __init__(self, filter_spec="fill-800x600", **kwargs):
        self.filter_spec = filter_spec
        super().__init__(**kwargs)

    def to_representation(self, relation):
        request = self.context.get("request")
        results = []
        for item in relation.all():
            if not item.image:
                continue
            data = ImageRenditionField(self.filter_spec).to_representation(item.image)
            url = data.get("url")
            if request and url and url.startswith("/"):
                url = request.build_absolute_uri(url)
            results.append(
                {
                    "url": url,
                    "width": data.get("width"),
                    "height": data.get("height"),
                    "alt": data.get("alt"),
                    "caption": item.caption,
                }
            )
        return results

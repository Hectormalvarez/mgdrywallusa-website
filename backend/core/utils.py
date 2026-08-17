"""Shared URL builders and media/image resolvers."""


def resolve_image_url(image, filter_spec="original"):
    """Resolve a Wagtail Image to its rendition URL string, or None on failure.

    Args:
        image: A wagtail.images.models.Image instance (or None).
        filter_spec: The Wagtail image rendition spec (default "original").

    Returns:
        str | None: The URL to the rendition, or None.
    """
    if not image:
        return None
    try:
        return image.get_rendition(filter_spec).url
    except Exception:
        return None


def resolve_media_url(request, url):
    """Build an absolute media URL from a relative path.

    Args:
        request: The current HTTP request (used for build_absolute_uri).
        url: A relative URL string (e.g. "/media/...").

    Returns:
        str: The absolute or relative URL.
    """
    if request and url and url.startswith("/"):
        return request.build_absolute_uri(url)
    return url

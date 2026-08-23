"""Custom table columns for the portfolio admin listing."""

from django.utils.html import format_html
from wagtail.admin.ui.tables import Column


class ImageThumbnailColumn(Column):
    """Render a 50×50 cropped thumbnail of the featured image."""

    def render_cell(self, instance):
        if instance.featured_image:
            rendition = instance.featured_image.get_rendition("fill-50x50")
            return format_html(
                '<img src="{}" width="50" height="50" '
                'style="border-radius:4px;object-fit:cover;" />',
                rendition.url,
            )
        return format_html(
            '<div style="width:50px;height:50px;background:#e2e8f0;'
            'border-radius:4px;"></div>'
        )

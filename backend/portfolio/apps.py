from django.apps import AppConfig


class PortfolioConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "portfolio"
    verbose_name = "Portfolio"

    def ready(self):
        # Cloudflare index-page purges for portfolio changes (US-008).
        # Wagtail's frontend_cache app handles each item's own URL; this
        # module covers the home + listing pages that embed item data.
        from . import signals  # noqa: F401

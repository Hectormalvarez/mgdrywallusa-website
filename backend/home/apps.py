from django.apps import AppConfig


class HomeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "home"
    verbose_name = "Home Pages"

    def ready(self):
        from django.db.models.signals import post_migrate
        from wagtail.snippets.models import register_snippet

        from home.admin import ServiceViewSet
        from home.bootstrap import ensure_site_homepage
        from home.models import Service

        register_snippet(Service, viewset=ServiceViewSet)

        # Runs after every migration has been applied, so all tables (including
        # those of apps that define Page subclasses) exist. No-op on databases
        # that already have a HomePage.
        post_migrate.connect(
            ensure_site_homepage,
            sender=self,
            dispatch_uid="home.ensure_site_homepage",
        )

from django.apps import AppConfig


class HomeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "home"
    verbose_name = "Home Pages"

    def ready(self):
        from wagtail.snippets.models import register_snippet

        from home.admin import ServiceViewSet
        from home.models import Service

        register_snippet(Service, viewset=ServiceViewSet)

from django.apps import AppConfig


class HomeConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "home"
    verbose_name = "Home Pages"

    def ready(self):
        from home.admin import ServiceViewSet
        from home.models import Service
        from wagtail.snippets.models import register_snippet

        register_snippet(Service, viewset=ServiceViewSet)
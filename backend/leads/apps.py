from django.apps import AppConfig


class LeadsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "leads"
    verbose_name = "Leads"

    def ready(self):
        from wagtail.snippets.models import register_snippet

        from leads.admin import LeadSnippetViewSet
        from leads.models import Lead

        register_snippet(Lead, viewset=LeadSnippetViewSet)

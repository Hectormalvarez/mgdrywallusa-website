from django.urls import path

from site_settings.views import PagePreviewAPIView, SiteSettingsAPIView

app_name = "site_settings"

urlpatterns = [
    path("preview/<str:token>/", PagePreviewAPIView.as_view(), name="page-preview"),
    path("settings/", SiteSettingsAPIView.as_view(), name="site-settings"),
]

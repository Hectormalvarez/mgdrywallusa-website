from django.urls import path

from site_settings.views import PagePreviewAPIView, SettingsPreviewTokenAPIView, SiteSettingsAPIView

app_name = "site_settings"

urlpatterns = [
    path("preview/<str:token>/", PagePreviewAPIView.as_view(), name="page-preview"),
    path(
        "settings-preview/<str:token>/",
        SettingsPreviewTokenAPIView.as_view(),
        name="settings-preview-token",
    ),
    path("settings/", SiteSettingsAPIView.as_view(), name="site-settings"),
]

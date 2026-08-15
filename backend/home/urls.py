from django.urls import path

from .views import PagePreviewAPIView, SiteSettingsAPIView

app_name = "home"

urlpatterns = [
    path("preview/<str:token>/", PagePreviewAPIView.as_view(), name="page-preview"),
    path("settings/", SiteSettingsAPIView.as_view(), name="site-settings"),
]
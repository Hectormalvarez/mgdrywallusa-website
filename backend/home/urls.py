from django.urls import path

from .views import PagePreviewAPIView

app_name = "home"

urlpatterns = [
    path("preview/<str:token>/", PagePreviewAPIView.as_view(), name="page-preview"),
]
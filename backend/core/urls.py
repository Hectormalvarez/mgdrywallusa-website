from django.conf import settings
from django.http import HttpResponse
from django.urls import path, include
from django.views.static import serve as static_serve
from wagtail.admin import urls as wagtailadmin_urls
from core.router import api_router
from leads.views import LeadCreateView


def root_view(request):
    return HttpResponse("Django OK")


urlpatterns = [
    path('', root_view),
    path('admin/', include(wagtailadmin_urls)),
    path('api/v1/leads/', LeadCreateView.as_view(), name='lead-create'),
    path('api/v1/', api_router.urls),
    path('api/v1/', include('home.urls')),
]

# Serve media files in all environments.
# In production behind a reverse proxy, the proxy should handle this; but
# for single-container Docker deployments with gunicorn we need Django to
# serve them directly.
urlpatterns += [
    path(
        "media/<path:path>",
        static_serve,
        {"document_root": settings.MEDIA_ROOT},
    ),
]

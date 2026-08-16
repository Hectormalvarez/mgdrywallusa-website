from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.urls import path, include
from wagtail.admin import urls as wagtailadmin_urls
from portfolio.api import api_router
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
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

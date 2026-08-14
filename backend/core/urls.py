from django.http import HttpResponse
from django.urls import path, include
from wagtail.admin import urls as wagtailadmin_urls
from portfolio.api import api_router


def root_view(request):
    return HttpResponse("Django OK")


urlpatterns = [
    path('', root_view),
    path('admin/', include(wagtailadmin_urls)),
    path('api/v1/', api_router.urls),
]

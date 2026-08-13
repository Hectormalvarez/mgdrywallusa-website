from django.http import HttpResponse
from django.urls import path, include
from wagtail.admin import urls as wagtailadmin_urls


def root_view(request):
    return HttpResponse("Django OK")


urlpatterns = [
    path('', root_view),
    path('admin/', include(wagtailadmin_urls)),
]

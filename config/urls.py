from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('wedding.urls')),
    # Media fayllar kam va kichik bo'lgani uchun Django o'zi beradi -
    # nginx konteyneriga host papkasini mount qilish shart emas
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

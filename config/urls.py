from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.decorators.cache import cache_control
from django.views.static import serve

# Django nom to'qnashuvida faylga yangi suffix qo'shadi, shuning uchun
# media URL'larini uzoq muddat immutable keshlash xavfsiz
cached_serve = cache_control(public=True, max_age=2592000, immutable=True)(serve)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('wedding.urls')),
    # Media fayllar kam va kichik bo'lgani uchun Django o'zi beradi -
    # nginx konteyneriga host papkasini mount qilish shart emas
    re_path(r'^media/(?P<path>.*)$', cached_serve, {'document_root': settings.MEDIA_ROOT}),
]

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView # tyufyth
from django.conf import settings
from django.conf.urls.static import static

def home(request):
    return JsonResponse({
        'message': 'SkillTestQuest API',
        'endpoints': {
            'modules': '/api/modules/',
            'tasks': '/api/tasks/',
            'admin': '/admin/',
            'forum': '/api/comments/',
            'profile': '/api/user-statistics/',
            'auth': '/api/token/',
            'register': '/api/register/'
        }
    })

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # jhbjd
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # yjyd
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

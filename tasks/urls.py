from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'modules', views.ModuleViewSet)  # регистрируем модули
router.register(r'tasks', views.TaskViewSet)      # регистрируем задания
router.register(r'comments', views.CommentViewSet)
router.register(r'theory', views.TheoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('check-answer/', views.check_answer, name='check-answer'),
    path('user-progress/<int:user_id>/', views.user_progress, name='user-progress'),
    path('register/', views.register, name='register'),
    path('user-statistics/', views.user_statistics, name='user-statistics'),
    path('current-user/', views.current_user, name='current-user'),
]
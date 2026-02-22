from django.contrib import admin
from .models import Module, Task, UserProgress
from .models import Theory

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'order']  # что показывать в списке
    list_editable = ['order']  # можно редактировать прямо в списке
    search_fields = ['title']  # поиск по названию

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'difficulty', 'task_type']
    list_filter = ['module', 'difficulty', 'task_type']  # фильтры справа
    search_fields = ['title', 'description']
    list_editable = ['difficulty']

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'task', 'correct', 'completed_at']
    list_filter = ['correct', 'completed_at']
    search_fields = ['user__username', 'task__title']

@admin.register(Theory)
class TheoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'order']
    list_filter = ['module']
    search_fields = ['title', 'content']
    list_editable = ['order']
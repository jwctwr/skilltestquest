from rest_framework import serializers
from .models import Module, Task, UserProgress
from .models import Comment
from .models import Theory

class ModuleSerializer(serializers.ModelSerializer):
    """Сериализатор для модулей"""
    tasks_count = serializers.SerializerMethodField()  # количество заданий в модуле
    
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'tasks_count']
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()

class TaskSerializer(serializers.ModelSerializer):
    """Сериализатор для заданий"""
    module_title = serializers.CharField(source='module.title', read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'question_text', 
                  'difficulty', 'task_type', 'module', 'module_title', 
                  'extra_data']

class UserProgressSerializer(serializers.ModelSerializer):
    """Сериализатор для прогресса"""
    task_title = serializers.CharField(source='task.title', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProgress
        fields = ['id', 'user', 'username', 'task', 'task_title', 
                  'completed', 'correct', 'attempts', 'completed_at']

class CommentSerializer(serializers.ModelSerializer):
    """Сериализатор для комментариев"""
    username = serializers.CharField(source='user.username', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True, default=None)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'username', 'task', 'task_title', 'content', 
                  'created_at', 'updated_at', 'parent', 'replies']
        read_only_fields = ['user', 'username', 'created_at', 'updated_at']
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []

class TheorySerializer(serializers.ModelSerializer):
    """Сериализатор для статей теории"""
    module_title = serializers.CharField(source='module.title', read_only=True)
    
    class Meta:
        model = Theory
        fields = ['id', 'module', 'module_title', 'title', 'content', 'order', 'created_at']
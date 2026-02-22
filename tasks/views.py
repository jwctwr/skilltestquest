from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Count, Q
from .models import Module, Task, UserProgress, Comment
from .serializers import ModuleSerializer, TaskSerializer, UserProgressSerializer, CommentSerializer
from .models import Theory
from .serializers import TheorySerializer

class ModuleViewSet(viewsets.ModelViewSet):
    """API для работы с модулями"""
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [AllowAny]

class TaskViewSet(viewsets.ModelViewSet):
    """API для работы с заданиями"""
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Фильтрация заданий по модулю и сложности"""
        queryset = Task.objects.all()
        
        module_id = self.request.query_params.get('module', None)
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        return queryset

class CommentViewSet(viewsets.ModelViewSet):
    """API для работы с комментариями"""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def recent(self, request):
        """Последние комментарии - доступно всем"""
        comments = Comment.objects.filter(parent=None).order_by('-created_at')[:20]
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def by_task(self, request):
        """Комментарии к заданию - доступно всем"""
        task_id = request.query_params.get('task_id')
        if task_id:
            comments = Comment.objects.filter(task_id=task_id, parent=None)
            serializer = self.get_serializer(comments, many=True)
            return Response(serializer.data)
        return Response({'error': 'task_id required'}, status=400)

@api_view(['POST'])
def check_answer(request):
    """
    API для проверки ответа и реализации адаптивной системы
    """
    task_id = request.data.get('task_id')
    user_answer = request.data.get('answer')
    
    user = request.user if request.user.is_authenticated else None
    
    if not user:
        return Response(
            {'error': 'Необходимо авторизоваться'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    task = get_object_or_404(Task, id=task_id)
    
    # Проверка в зависимости от типа задания
    is_correct = False
    
    if task.task_type == 'text':
        # Обычный текстовый ответ
        is_correct = (user_answer.lower().strip() == task.correct_answer.lower().strip())
    
    elif task.task_type == 'multiple_choice':
        # Для множественного выбора
        try:
            selected_index = int(user_answer)
            is_correct = (selected_index == task.extra_data.get('correct_index'))
        except:
            is_correct = False
    
    elif task.task_type == 'match':
        # Для сопоставления
        try:
            import json
            user_matches = json.loads(user_answer)
            correct_pairs = {pair['left']: pair['right'] for pair in task.extra_data.get('pairs', [])}
            
            is_correct = True
            for left, right in user_matches.items():
                if correct_pairs.get(left) != right:
                    is_correct = False
                    break
        except:
            is_correct = False
    
    elif task.task_type == 'classify':
        # Для классификации
        try:
            import json
            user_class = json.loads(user_answer)
            correct_items = {item['text']: item['category'] for item in task.extra_data.get('items', [])}
            
            is_correct = True
            for item, category in user_class.items():
                if correct_items.get(item) != category:
                    is_correct = False
                    break
        except:
            is_correct = False
    
    else:
        # По умолчанию - текстовое сравнение
        is_correct = (user_answer.lower().strip() == task.correct_answer.lower().strip())
    
    # Сохраняем прогресс
    progress, created = UserProgress.objects.get_or_create(
        user=user,
        task=task,
        defaults={'attempts': 1, 'correct': is_correct, 'completed': True}
    )
    
    if not created:
        progress.attempts += 1
        progress.correct = is_correct
        progress.completed = True
        progress.save()
    
    # Определяем следующее задание на основе сложности
    next_task = None
    if is_correct:
        if task.difficulty == 'easy':
            next_task = Task.objects.filter(difficulty='medium', module=task.module).first()
        elif task.difficulty == 'medium':
            next_task = Task.objects.filter(difficulty='hard', module=task.module).first()
    else:
        if task.difficulty == 'hard':
            next_task = Task.objects.filter(difficulty='medium', module=task.module).first()
        elif task.difficulty == 'medium':
            next_task = Task.objects.filter(difficulty='easy', module=task.module).first()
    
    if not next_task:
        next_task = Task.objects.filter(module=task.module).exclude(id=task.id).first()
    
    next_task_data = TaskSerializer(next_task).data if next_task else None
    
    return Response({
        'correct': is_correct,
        'message': 'Правильно!' if is_correct else 'Неправильно. Попробуйте еще!',
        'next_task': next_task_data,
        'progress': {
            'attempts': progress.attempts,
            'completed': progress.completed
        }
    })

@api_view(['GET'])
def user_progress(request, user_id):
    """API для получения прогресса пользователя"""
    progress = UserProgress.objects.filter(user_id=user_id)
    serializer = UserProgressSerializer(progress, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """API для регистрации новых пользователей"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Заполните все обязательные поля'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Пользователь с таким именем уже существует'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User.objects.create_user(
        username=username, 
        email=email, 
        password=password
    )
    
    return Response(
        {'success': 'Пользователь успешно создан'}, 
        status=status.HTTP_201_CREATED
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_statistics(request):
    """Получение статистики пользователя для профиля"""
    user = request.user
    
    total_attempts = UserProgress.objects.filter(user=user).count()
    correct_answers = UserProgress.objects.filter(user=user, correct=True).count()
    
    modules_stats = []
    for module in Module.objects.all():
        tasks_in_module = Task.objects.filter(module=module)
        attempts = UserProgress.objects.filter(
            user=user, 
            task__in=tasks_in_module
        )
        
        modules_stats.append({
            'module_id': module.id,
            'module_title': module.title,
            'total_tasks': tasks_in_module.count(),
            'completed': attempts.filter(completed=True).count(),
            'correct': attempts.filter(correct=True).count(),
        })
    
    mistakes_by_topic = []
    for module in Module.objects.all():
        mistakes = UserProgress.objects.filter(
            user=user,
            task__module=module,
            correct=False
        ).count()
        
        if mistakes > 0:
            mistakes_by_topic.append({
                'topic': module.title,
                'mistakes': mistakes
            })
    
    mistakes_by_topic.sort(key=lambda x: x['mistakes'], reverse=True)
    
    return Response({
        'total_attempts': total_attempts,
        'correct_answers': correct_answers,
        'accuracy': round(correct_answers / total_attempts * 100, 1) if total_attempts > 0 else 0,
        'modules_stats': modules_stats,
        'top_mistakes': mistakes_by_topic[:5],
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Получение информации о текущем пользователе"""
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'date_joined': user.date_joined
    })

class TheoryViewSet(viewsets.ModelViewSet):
    """API для работы со статьями теории"""
    queryset = Theory.objects.all()
    serializer_class = TheorySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Theory.objects.all()
        module_id = self.request.query_params.get('module', None)
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        return queryset
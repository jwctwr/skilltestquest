from django.db import models
from django.contrib.auth.models import User

class Module(models.Model):
    """Модель для модулей обучения (как в Таблице 1 документа)"""
    title = models.CharField('Название', max_length=200)
    description = models.TextField('Описание', blank=True)
    order = models.IntegerField('Порядок', default=0)  # чтобы сортировать модули
    
    class Meta:
        verbose_name = 'Модуль'
        verbose_name_plural = 'Модули'
        ordering = ['order']  # сортировка по порядку
    
    def __str__(self):
        return self.title

class Task(models.Model):
    """Модель для заданий"""
    DIFFICULTY_CHOICES = [
        ('easy', 'Легкий'),
        ('medium', 'Средний'),
        ('hard', 'Сложный'),
    ]
    
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='tasks', verbose_name='Модуль')
    title = models.CharField('Название задания', max_length=200)
    description = models.TextField('Описание задания')
    question_text = models.TextField('Текст вопроса')  # сам вопрос
    correct_answer = models.CharField('Правильный ответ', max_length=500)  # для простых ответов
    difficulty = models.CharField('Сложность', max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    order = models.IntegerField('Порядок в модуле', default=0)
    
    # Поля для разных типов заданий 
    task_type = models.CharField('Тип задания', max_length=50, default='text', 
                             choices=[
                                 ('text', 'Текстовый ответ'),
                                 ('find_bug', 'Найди баг'),
                                 ('match', 'Сопоставление'),
                                 ('classify', 'Классификация'),
                                 ('multiple_choice', 'Множественный выбор'),
                             ])
    
    # Дополнительные данные в JSON 
    extra_data = models.JSONField('Дополнительные данные', default=dict, blank=True)
    
    class Meta:
        verbose_name = 'Задание'
        verbose_name_plural = 'Задания'
        ordering = ['module', 'order']
    
    def __str__(self):
        return f"{self.title} ({self.get_difficulty_display()})"

class UserProgress(models.Model):
    """Модель для отслеживания прогресса пользователя"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress', verbose_name='Пользователь')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, verbose_name='Задание')
    completed = models.BooleanField('Выполнено', default=False)
    correct = models.BooleanField('Правильно', default=False)
    attempts = models.IntegerField('Попыток', default=0)
    completed_at = models.DateTimeField('Дата выполнения', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Прогресс пользователя'
        verbose_name_plural = 'Прогресс пользователей'
        # Чтобы не было дубликатов 
        unique_together = ['user', 'task']
    
    def __str__(self):
        status = '✅' if self.correct else '❌'
        return f"{self.user.username} - {self.task.title} - {status}"

class Comment(models.Model):
    """Модель для комментариев на форуме"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments', verbose_name='Автор')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments', verbose_name='Задание', null=True, blank=True)
    content = models.TextField('Текст комментария')
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies', verbose_name='Ответ на')
    
    class Meta:
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'
        ordering = ['-created_at']  # сначала новые
    
    def __str__(self):
        return f"{self.user.username}: {self.content[:50]}..."

class Theory(models.Model):
    """Модель для статей теории"""
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='theories', verbose_name='Модуль')
    title = models.CharField('Заголовок', max_length=200)
    content = models.TextField('Содержание')
    order = models.IntegerField('Порядок', default=0)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    
    class Meta:
        verbose_name = 'Статья теории'
        verbose_name_plural = 'Статьи теории'
        ordering = ['module', 'order']
    
    def __str__(self):
        return f"{self.module.title} - {self.title}"

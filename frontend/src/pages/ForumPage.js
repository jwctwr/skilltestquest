import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../services/auth';
import api from '../services/api';
import './ForumPage.css';

function ForumPage() {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    loadRecentComments();
    loadTasks();
  }, []);

  const loadRecentComments = async () => {
    try {
      setLoading(true);
      console.log('Загружаем комментарии...');
      
      const response = await api.get('comments/recent/');
      console.log('Комментарии загружены:', response.data);
      
      setComments(response.data);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки комментариев:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Не удалось загрузить комментарии');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await api.get('tasks/');
      setTasks(response.data);
    } catch (err) {
      console.error('Ошибка загрузки заданий:', err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      console.log('Отправляем комментарий:', {
        content: newComment,
        task: selectedTask
      });
      
      const response = await api.post('comments/', {
        content: newComment,
        task: selectedTask || null
      });
      
      console.log('Ответ сервера:', response.data);
      
      // Добавляем новый комментарий в начало списка
      setComments([response.data, ...comments]);
      setNewComment('');
      setSelectedTask(null);
      
    } catch (err) {
      console.error('Детали ошибки при отправке:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      alert('Ошибка при отправке комментария: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!replyText.trim()) return;
    
    try {
      const response = await api.post('comments/', {
        content: replyText,
        parent: commentId
      });
      
      // Обновляем список коммов
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.data]
          };
        }
        return comment;
      });
      
      setComments(updatedComments);
      setReplyTo(null);
      setReplyText('');
      
    } catch (err) {
      console.error('Ошибка при отправке ответа:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="forum-page">
      <button className="back-button" onClick={() => navigate('/')}>
        ← На главную
      </button>

      <div className="forum-header">
        <h1>Форум обсуждений</h1>
        <p>Общайтесь, задавайте вопросы, помогайте друг другу</p>
      </div>

      {/* Форма нового комментария */}
      <div className="new-comment-section">
        <h2>Новое обсуждение</h2>
        <form onSubmit={handleSubmitComment} className="comment-form">
          <select 
            value={selectedTask || ''} 
            onChange={(e) => setSelectedTask(e.target.value ? parseInt(e.target.value) : null)}
            className="task-select"
          >
            <option value="">Общий вопрос (не к заданию)</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.title} ({task.module_title || 'Без модуля'})
              </option>
            ))}
          </select>
          
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Напишите ваш вопрос или мысль..." : "Войдите, чтобы писать комментарии"}
            rows="4"
            className="comment-input"
            disabled={!user}
          />
          
          <button 
            type="submit" 
            className="submit-comment-button"
            disabled={!user || !newComment.trim()}
          >
            {user ? 'Отправить' : 'Войдите для отправки'}
          </button>
        </form>
      </div>

      {/* Список комментариев */}
      <div className="comments-section">
        <h2>Последние обсуждения</h2>
        
        {loading && <div className="loading">Загрузка...</div>}
        {error && <div className="error">{error}</div>}
        
        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="comment-card">
                <div className="comment-header">
                  <span className="comment-author">{comment.username || 'Пользователь'}</span>
                  <span className="comment-date">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                
                {comment.task && comment.task_title && (
                  <div className="comment-task">
                    К заданию: {comment.task_title}
                  </div>
                )}
                
                <div className="comment-content">{comment.content}</div>
                
                {/* Ответы на комментарий */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="comment-replies">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="reply-card">
                        <span className="reply-author">{reply.username}</span>
                        <span className="reply-date">{formatDate(reply.created_at)}</span>
                        <div className="reply-content">{reply.content}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Кнопка ответа */}
                {user && (
                  <div className="reply-section">
                    <button 
                      className="reply-button"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    >
                      {replyTo === comment.id ? 'Отмена' : 'Ответить'}
                    </button>
                    
                    {replyTo === comment.id && (
                      <div className="reply-form">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Ваш ответ..."
                          rows="2"
                          className="reply-input"
                        />
                        <button 
                          onClick={() => handleSubmitReply(comment.id)}
                          className="submit-reply-button"
                          disabled={!replyText.trim()}
                        >
                          Отправить ответ
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            !loading && (
              <div className="no-comments">Пока нет обсуждений. Будьте первым!</div>
            )
          )}
        </div>
      </div>

      {/* Нижняя навигация */}
      <nav className="bottom-nav">
        <button className="nav-button" onClick={() => navigate('/')}>📚 Задания</button>
        <button className="nav-button" onClick={() => navigate('/theory')}>📖 Теория</button>
        <button className="nav-button active">💬 Форум</button>
        <button className="nav-button" onClick={() => navigate('/profile')}>👤 Профиль</button>
      </nav>
    </div>
  );
}

export default ForumPage;

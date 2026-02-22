import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTasks, getModule } from '../services/api';
import './ModulePage.css';

function ModulePage() {
  const { id } = useParams(); // получаем id модуля из URL
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadModuleData();
  }, [id]);

  const loadModuleData = async () => {
    try {
      setLoading(true);
      // Загружаем информацию о модуле
      const moduleResponse = await getModule(id);
      setModule(moduleResponse.data);
      
      // Загружаем задания этого модуля
      const tasksResponse = await getTasks({ module: id });
      setTasks(tasksResponse.data);
      
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки данных модуля');
      console.error('Ошибка:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTask = (taskId) => {
    navigate(`/task/${taskId}`); // переходим на страницу задания
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="module-page">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Назад к модулям
      </button>
      
      <div className="module-header">
        <h1>{module?.title}</h1>
        <p className="module-description">{module?.description}</p>
      </div>

      <div className="tasks-section">
        <h2>Задания модуля</h2>
        <div className="tasks-grid">
          {tasks.map((task, index) => (
            <div key={task.id} className={`task-card difficulty-${task.difficulty}`}>
              <div className="task-number">Задание {index + 1}</div>
              <h3>{task.title}</h3>
              <p className="task-description">{task.description}</p>
              
              <div className="task-meta">
                <span className={`difficulty-badge ${task.difficulty}`}>
                  {task.difficulty === 'easy' ? 'Легкое' : 
                   task.difficulty === 'medium' ? 'Среднее' : 'Сложное'}
                </span>
                <span className="task-type">
                  {task.task_type === 'text' ? '📝 Текстовый' :
                   task.task_type === 'find_bug' ? '🐛 Найди баг' :
                   task.task_type === 'match' ? '🔄 Сопоставление' : '📊 Классификация'}
                </span>
              </div>
              
              <button 
                className="start-task-button"
                onClick={() => startTask(task.id)}
              >
                Начать задание
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Нижняя навигация (та же, что и на главной) */}
      <nav className="bottom-nav">
        <button className="nav-button" onClick={() => navigate('/')}>📚 Задания</button>
        <button className="nav-button">📖 Теория</button>
        <button className="nav-button">💬 Форум</button>
        <button className="nav-button">👤 Профиль</button>
      </nav>
    </div>
  );
}

export default ModulePage;
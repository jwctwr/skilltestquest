import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';  // добавьте эту строку
import { getModules } from '../services/api';
import { getUser, logout } from '../services/auth';
import './MainPage.css';

function MainPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadModules();
    checkUser();
  }, []);

  const checkUser = () => {
  const userData = getUser();
  setUser(userData);
};

const loadModules = async () => {
  try {
    setLoading(true);
    console.log('Запрашиваем модули с URL:', 'http://127.0.0.1:8000/api/modules/');
    
    const response = await getModules();
    console.log('Ответ от сервера:', response);
    console.log('Данные:', response.data);
    console.log('Длина массива модулей:', response.data.length);
    
    setModules(response.data);
    setError(null);
  } catch (err) {
    console.error('Детали ошибки:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      config: err.config
    });
    
    if (err.response?.status === 401) {
      setError('Ошибка авторизации. Пробуем без токена...');
      // Пробуем загрузить без токена
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/modules/');
        setModules(response.data);
        setError(null);
      } catch (retryErr) {
        setError('Ошибка загрузки модулей. Убедитесь, что Django сервер запущен.');
      }
    } else {
      setError('Ошибка загрузки модулей. Убедитесь, что Django сервер запущен.');
    }
  } finally {
    setLoading(false);
  }
};

  const startModule = (moduleId) => {
    navigate(`/module/${moduleId}`);
  };

  const handleLogout = () => {
  logout();           // удаляем токены
  setUser(null);      // очищаем пользователя в состоянии
};

  return (
    <div className="App">
      {/* Шапка с кнопками входа */}
      <header className="app-header">
        <div className="header-top">
          <h1>SkillTestQuest</h1>
          <div className="auth-buttons">
            {user ? (
              <>
                <span className="user-greeting">Привет, {user.username}!</span>
                <button onClick={handleLogout} className="auth-button logout">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="auth-button login">
                  Войти
                </button>
                <button onClick={() => navigate('/register')} className="auth-button register">
                  Регистрация
                </button>
              </>
            )}
          </div>
        </div>
        <p>Интерактивная платформа для изучения тестирования</p>
      </header>

      {/* Нижняя навигация */}
      <nav className="bottom-nav">
        <button className="nav-button active" onClick={() => navigate('/')}>📚 Задания</button>
        <button className="nav-button" onClick={() => navigate('/theory')}>📖 Теория</button>
        <button className="nav-button" onClick={() => navigate('/forum')}>💬 Форум</button>
        <button className="nav-button" onClick={() => navigate('/profile')}>👤 Профиль</button>
      </nav>

      {/* Основной контент */}
      <main className="main-content">
        {loading && <div className="loading">Загрузка...</div>}
        
        {error && (
          <div className="error">
            <p>{error}</p>
            <button onClick={loadModules} className="retry-button">
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <h2>Модули обучения</h2>
            {modules.length === 0 ? (
              <div className="no-modules">
                <p>Модули не найдены. Создайте их в админке Django.</p>
              </div>
            ) : (
              <div className="modules-grid">
                {modules.map(module => (
                  <div key={module.id} className="module-card">
                    <h3>{module.title}</h3>
                    <p>{module.description || 'Нет описания'}</p>
                    <div className="module-footer">
                      <span className="tasks-count">
                        Заданий: {module.tasks_count || 0}
                      </span>
                      <button 
                        className="start-button"
                        onClick={() => startModule(module.id)}
                      >
                        Начать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default MainPage;
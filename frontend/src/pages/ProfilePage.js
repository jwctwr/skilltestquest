import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout, getAccessToken } from '../services/auth';  // добавили getAccessToken
import { getUserStatistics } from '../services/api';  // добавили getUserStatistics
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import './ProfilePage.css';

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // проверка авторизации
    const currentUser = getUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      console.log('Загружаем статистику...');
      console.log('Токен:', getAccessToken());
      
      const response = await getUserStatistics();
      console.log('Статистика загружена:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Детали ошибки:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.status === 401) {
        setError('Необходимо авторизоваться. Перенаправление...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Не удалось загрузить статистику');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Цвета для графиков
  const COLORS = ['#667eea', '#764ba2', '#28a745', '#ffc107', '#dc3545'];

  // Данные для круговой диаграммы
  const pieData = stats ? [
    { name: 'Правильно', value: stats.correct_answers || 0 },
    { name: 'Неправильно', value: (stats.total_attempts - stats.correct_answers) || 0 }
  ] : [];

  if (loading) return <div className="loading">Загрузка профиля...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return <div className="error">Нет данных</div>;

  return (
    <div className="profile-page">
      <button className="back-button" onClick={() => navigate('/')}>
        ← На главную
      </button>

      <div className="profile-header">
        <div className="profile-avatar">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h1>{user?.username}</h1>
          <p>ID: {user?.id}</p>
          <button onClick={handleLogout} className="logout-button">
            Выйти
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {/* Карточки с общей статистикой */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{stats.total_attempts || 0}</div>
            <div className="stat-label">Всего попыток</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.correct_answers || 0}</div>
            <div className="stat-label">Правильных ответов</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.accuracy || 0}%</div>
            <div className="stat-label">Точность</div>
          </div>
        </div>

        {/* Графики в два столбца */}
        <div className="charts-row">
          {/* Круговая диаграмма */}
          <div className="chart-container">
            <h3>Соотношение ответов</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Прогресс по модулям */}
          <div className="chart-container">
            <h3>Прогресс по модулям</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.modules_stats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="module_title" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="correct" fill="#28a745" name="Правильно" />
                <Bar dataKey="completed" fill="#667eea" name="Выполнено" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Таблица с темами ошибок */}
        <div className="mistakes-section">
          <h3>Темы с наибольшим количеством ошибок</h3>
          <table className="mistakes-table">
            <thead>
              <tr>
                <th>Тема</th>
                <th>Ошибок</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_mistakes && stats.top_mistakes.length > 0 ? (
                stats.top_mistakes.map((topic, index) => (
                  <tr key={index}>
                    <td>{topic.topic}</td>
                    <td>{topic.mistakes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="no-data">Нет ошибок! Отлично!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Детальная статистика по модулям */}
        <div className="detailed-stats">
          <h3>Детальная статистика</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Модуль</th>
                <th>Всего заданий</th>
                <th>Выполнено</th>
                <th>Правильно</th>
                <th>Прогресс</th>
              </tr>
            </thead>
            <tbody>
              {stats.modules_stats && stats.modules_stats.length > 0 ? (
                stats.modules_stats.map((module) => (
                  <tr key={module.module_id}>
                    <td>{module.module_title}</td>
                    <td>{module.total_tasks}</td>
                    <td>{module.completed}</td>
                    <td>{module.correct}</td>
                    <td>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: module.total_tasks > 0 
                              ? `${(module.completed / module.total_tasks) * 100}%` 
                              : '0%'
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">Нет данных по модулям</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Нижняя навигация */}
      <nav className="bottom-nav">
        <button className="nav-button" onClick={() => navigate('/')}>📚 Задания</button>
        <button className="nav-button">📖 Теория</button>
        <button className="nav-button">💬 Форум</button>
        <button className="nav-button active">👤 Профиль</button>
      </nav>
    </div>
  );
}

export default ProfilePage;

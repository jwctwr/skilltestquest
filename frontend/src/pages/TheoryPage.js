import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './TheoryPage.css';

function TheoryPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [theories, setTheories] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTheory, setSelectedTheory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Загружаем модули
      const modulesResponse = await api.get('modules/');
      setModules(modulesResponse.data);
      
      // Загружаем статьи теории
      const theoryResponse = await api.get('theory/');
      setTheories(theoryResponse.data);
      
      if (modulesResponse.data.length > 0) {
        setSelectedModule(modulesResponse.data[0].id);
      }
    } catch (err) {
      setError('Не удалось загрузить теорию');
      console.error('Ошибка:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTheoriesByModule = (moduleId) => {
    return theories.filter(t => t.module === moduleId);
  };

  const renderTheoryContent = () => {
    if (!selectedTheory) return null;
    
    // Разбиваем контент на абзацы
    const paragraphs = selectedTheory.content.split('\n\n');
    
    return (
      <div className="theory-content">
        <h2>{selectedTheory.title}</h2>
        <div className="theory-text">
          {paragraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Загрузка теории...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="theory-page">
      <button className="back-button" onClick={() => navigate('/')}>
        ← На главную
      </button>

      <div className="theory-header">
        <h1>Теория тестирования</h1>
        <p>Изучите основы перед выполнением заданий</p>
      </div>

      <div className="theory-container">
        {/* Боковое меню с модулями */}
        <div className="theory-sidebar">
          <h3>Модули</h3>
          <ul className="module-list">
            {modules.map(module => (
              <li key={module.id}>
                <button
                  className={`module-button ${selectedModule === module.id ? 'active' : ''}`}
                  onClick={() => setSelectedModule(module.id)}
                >
                  {module.title}
                </button>
                
                {/* Статьи выбранного модуля */}
                {selectedModule === module.id && (
                  <ul className="theory-list">
                    {getTheoriesByModule(module.id).map(theory => (
                      <li key={theory.id}>
                        <button
                          className={`theory-button ${selectedTheory?.id === theory.id ? 'active' : ''}`}
                          onClick={() => setSelectedTheory(theory)}
                        >
                          {theory.title}
                        </button>
                      </li>
                    ))}
                    {getTheoriesByModule(module.id).length === 0 && (
                      <li className="no-theory">Нет статей</li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Область отображения теории */}
        <div className="theory-main">
          {selectedTheory ? (
            renderTheoryContent()
          ) : (
            <div className="theory-placeholder">
              <h2>Добро пожаловать в раздел теории!</h2>
              <p>Выберите тему из списка слева, чтобы начать изучение</p>
            </div>
          )}
        </div>
      </div>

      {/* Нижняя навигация */}
      <nav className="bottom-nav">
        <button className="nav-button" onClick={() => navigate('/')}>📚 Задания</button>
        <button className="nav-button active">📖 Теория</button>
        <button className="nav-button" onClick={() => navigate('/forum')}>💬 Форум</button>
        <button className="nav-button" onClick={() => navigate('/profile')}>👤 Профиль</button>
      </nav>
    </div>
  );
}

export default TheoryPage;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, checkAnswer } from '../services/api';
import './TaskPage.css';

function TaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matches, setMatches] = useState({});
  const [classification, setClassification] = useState({});
  const [result, setResult] = useState(null);
  const [nextTask, setNextTask] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await getTask(id);
      console.log('Загружено задание:', response.data);
      
      // Автоматическое определение типа, если нужно
      const taskData = response.data;
      if (taskData.extra_data?.options && taskData.task_type === 'text') {
        taskData.task_type = 'multiple_choice';
      }
      if (taskData.extra_data?.pairs && taskData.task_type === 'text') {
        taskData.task_type = 'match';
      }
      if (taskData.extra_data?.categories && taskData.task_type === 'text') {
        taskData.task_type = 'classify';
      }
      
      setTask(taskData);
      resetState();
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки задания:', err);
      setError('Ошибка загрузки задания');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setAnswer('');
    setSelectedOption(null);
    setSelectedLeft(null);
    setMatches({});
    setClassification({});
    setResult(null);
    setNextTask(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalAnswer = answer;
    
    // Формируем ответ в зависимости от типа задания
    if (task.task_type === 'multiple_choice') {
      if (selectedOption === null) {
        alert('Выберите вариант ответа');
        return;
      }
      finalAnswer = selectedOption.toString();
    } 
    else if (task.task_type === 'match') {
      if (Object.keys(matches).length !== task.extra_data?.pairs?.length) {
        alert('Сопоставьте все термины');
        return;
      }
      finalAnswer = JSON.stringify(matches);
    } 
    else if (task.task_type === 'classify') {
      if (Object.keys(classification).length !== task.extra_data?.items?.length) {
        alert('Распределите все элементы по категориям');
        return;
      }
      finalAnswer = JSON.stringify(classification);
    }
    else if (task.task_type === 'find_bug') {
      if (!answer) {
        alert('Кликните на изображении');
        return;
      }
    }
    else {
      if (!answer.trim()) {
        alert('Введите ответ');
        return;
      }
    }

    try {
      setLoading(true);
      console.log('Отправляем ответ:', finalAnswer);
      const response = await checkAnswer(id, finalAnswer);
      console.log('Ответ от сервера:', response.data);
      setResult(response.data);
      setAttempts(response.data.progress.attempts);
      
      if (response.data.next_task) {
        setNextTask(response.data.next_task);
      }
      
    } catch (err) {
      console.error('Ошибка при проверке ответа:', err);
      if (err.response?.status === 401) {
        setError('Необходимо авторизоваться');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Ошибка при проверке ответа');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setAnswer(JSON.stringify({x, y}));
    console.log('Клик на изображении:', x, y);
  };

  const handleMatchLeft = (leftItem) => {
    setSelectedLeft(leftItem);
  };

  const handleMatchRight = (rightItem) => {
    if (selectedLeft) {
      setMatches({
        ...matches,
        [selectedLeft]: rightItem
      });
      setSelectedLeft(null);
    }
  };

  const handleClassify = (item, category) => {
    setClassification({
      ...classification,
      [item]: category
    });
  };

  const goToNextTask = () => {
    if (nextTask) {
      navigate(`/task/${nextTask.id}`);
    }
  };

  const goBack = () => {
    if (task) {
      navigate(`/module/${task.module}`);
    }
  };

  const renderTaskContent = () => {
    if (!task) return null;

    switch (task.task_type) {
      case 'multiple_choice':
        return (
          <div className="task-content multiple-choice">
            <p className="task-question">{task.question_text}</p>
            <div className="options-list">
              {task.extra_data?.options?.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${selectedOption === index ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedOption(index);
                    setAnswer(index.toString());
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 'match':
        return (
          <div className="task-content match">
            <p className="task-question">{task.question_text}</p>
            <div className="match-game">
              <div className="match-left">
                <h4>Термины</h4>
                {task.extra_data?.pairs?.map((pair, index) => (
                  <div
                    key={index}
                    className={`match-item ${selectedLeft === pair.left ? 'selected' : ''} ${matches[pair.left] ? 'matched' : ''}`}
                    onClick={() => !matches[pair.left] && handleMatchLeft(pair.left)}
                  >
                    {pair.left}
                  </div>
                ))}
              </div>
              <div className="match-right">
                <h4>Определения</h4>
                {task.extra_data?.pairs?.map((pair, index) => {
                  const isMatched = Object.values(matches).includes(pair.right);
                  return (
                    <div
                      key={index}
                      className={`match-item ${isMatched ? 'matched' : ''} ${selectedLeft && !isMatched ? 'available' : ''}`}
                      onClick={() => !isMatched && handleMatchRight(pair.right)}
                    >
                      {pair.right}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="match-status">
              Сопоставлено: {Object.keys(matches).length} из {task.extra_data?.pairs?.length || 0}
            </div>
          </div>
        );

      case 'classify':
        return (
          <div className="task-content classify">
            <p className="task-question">{task.question_text}</p>
            <div className="classification-game">
              <div className="items-pool">
                <h4>Элементы для классификации</h4>
                {task.extra_data?.items?.map((item, index) => (
                  !classification[item.text] && (
                    <div
                      key={index}
                      className="classify-item"
                      onClick={() => {
                        const categories = task.extra_data.categories.map(c => c.name).join(', ');
                        const category = prompt(`Выберите категорию (${categories}):`);
                        if (category && task.extra_data.categories.find(c => c.name === category)) {
                          handleClassify(item.text, category);
                        }
                      }}
                    >
                      {item.text}
                    </div>
                  )
                ))}
              </div>
              <div className="categories-container">
                {task.extra_data?.categories?.map((category, catIndex) => (
                  <div key={catIndex} className="category-column" style={{borderColor: category.color}}>
                    <h4 style={{color: category.color}}>{category.name}</h4>
                    {Object.entries(classification).map(([item, cat]) => 
                      cat === category.name && (
                        <div key={item} className="classified-item">
                          {item}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'find_bug':
        return (
          <div className="task-content find-bug">
            <p className="task-question">{task.question_text}</p>
            <div className="bug-image-container">
              <img 
                src={task.extra_data?.image_url || 'https://via.placeholder.com/600x400?text=Скриншот+интерфейса'} 
                alt="Интерфейс для тестирования"
                className="bug-image"
                onClick={handleImageClick}
              />
              <p className="image-hint">Кликните на месте, где нашли баг</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="task-content text">
            <p className="task-question">{task.question_text}</p>
          </div>
        );
    }
  };

  if (loading && !task) return <div className="loading">Загрузка задания...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="task-page">
      <button className="back-button" onClick={goBack}>
        ← Назад к модулю
      </button>

      <div className="task-container">
        <div className="task-header">
          <h1>{task?.title}</h1>
          <div className="task-meta">
            <span className={`difficulty-badge ${task?.difficulty}`}>
              {task?.difficulty === 'easy' ? 'Легкое' : 
               task?.difficulty === 'medium' ? 'Среднее' : 'Сложное'}
            </span>
            <span className="task-type-badge">
              {task?.task_type === 'text' ? '📝 Текстовый ответ' :
               task?.task_type === 'multiple_choice' ? '✅ Выбор ответа' :
               task?.task_type === 'match' ? '🔄 Сопоставление' :
               task?.task_type === 'classify' ? '📊 Классификация' :
               task?.task_type === 'find_bug' ? '🐛 Найди баг' : '📝 Задание'}
            </span>
            {attempts > 0 && (
              <span className="attempts-badge">
                Попыток: {attempts}
              </span>
            )}
          </div>
        </div>

        <div className="task-body">
          {renderTaskContent()}

          {!result ? (
            <form onSubmit={handleSubmit} className="answer-form">
              {task?.task_type === 'text' && (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Введите ваш ответ..."
                  rows="4"
                  className="answer-input"
                  disabled={loading}
                />
              )}
              
              {(task?.task_type === 'multiple_choice' || 
                task?.task_type === 'match' || 
                task?.task_type === 'classify' ||
                task?.task_type === 'find_bug') && (
                <p className="selection-hint">
                  {task?.task_type === 'multiple_choice' && '👆 Выберите один из вариантов выше'}
                  {task?.task_type === 'match' && '👆 Кликните на термин, затем на определение'}
                  {task?.task_type === 'classify' && '👆 Кликните на элемент, затем введите категорию'}
                  {task?.task_type === 'find_bug' && '👆 Кликните на изображении в месте бага'}
                </p>
              )}
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading || (
                  (task?.task_type === 'text' && !answer.trim()) ||
                  (task?.task_type === 'multiple_choice' && selectedOption === null) ||
                  (task?.task_type === 'match' && Object.keys(matches).length !== task?.extra_data?.pairs?.length) ||
                  (task?.task_type === 'classify' && Object.keys(classification).length !== task?.extra_data?.items?.length) ||
                  (task?.task_type === 'find_bug' && !answer)
                )}
              >
                {loading ? 'Проверка...' : 'Проверить ответ'}
              </button>
            </form>
          ) : (
            <div className="result-container">
              <div className={`result-message ${result.correct ? 'correct' : 'incorrect'}`}>
                {result.correct ? (
                  <>
                    <span className="result-icon">✅</span>
                    <p>{result.message}</p>
                  </>
                ) : (
                  <>
                    <span className="result-icon">❌</span>
                    <p>{result.message}</p>
                  </>
                )}
              </div>

              {nextTask && (
                <div className="next-task-prompt">
                  <p>Адаптивная система подобрала следующее задание:</p>
                  <div className="next-task-info">
                    <h3>{nextTask.title}</h3>
                    <span className={`difficulty-badge ${nextTask.difficulty}`}>
                      {nextTask.difficulty === 'easy' ? 'Легкое' : 
                       nextTask.difficulty === 'medium' ? 'Среднее' : 'Сложное'}
                    </span>
                  </div>
                  <button onClick={goToNextTask} className="next-task-button">
                    Перейти к следующему заданию →
                  </button>
                </div>
              )}

              {!nextTask && (
                <button onClick={loadTask} className="retry-button">
                  Попробовать снова
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="bottom-nav">
        <button className="nav-button" onClick={() => navigate('/')}>📚 Задания</button>
        <button className="nav-button" onClick={() => navigate('/theory')}>📖 Теория</button>
        <button className="nav-button" onClick={() => navigate('/forum')}>💬 Форум</button>
        <button className="nav-button" onClick={() => navigate('/profile')}>👤 Профиль</button>
      </nav>
    </div>
  );
}

export default TaskPage;
import axios from 'axios';
import { getAccessToken } from './auth';

// Определяем базовый URL 
const getBaseUrl = () => {
  //  находимся ли мы на Render
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://skilltestquest.onrender.com/api/';
  }
  // Локальная разработка
  return 'http://127.0.0.1:8000/api/';
};

const API_URL = getBaseUrl();
console.log('API URL:', API_URL); // для отладки

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// токен к запросам
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// для работы с модулями
export const getModules = () => api.get('modules/');
export const getModule = (id) => api.get(`modules/${id}/`);

// с заданиями
export const getTasks = (params = {}) => api.get('tasks/', { params });
export const getTask = (id) => api.get(`tasks/${id}/`);

// для проверки ответа
export const checkAnswer = (taskId, answer) => {
  return api.post('check-answer/', {
    task_id: taskId,
    answer: answer
  });
};

// для получения прогресса пользователя
export const getUserProgress = (userId) => api.get(`user-progress/${userId}/`);

// для получения статистики пользователя
export const getUserStatistics = () => api.get('user-statistics/');

export default api;

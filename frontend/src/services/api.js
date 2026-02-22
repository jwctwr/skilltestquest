import axios from 'axios';
import { getAccessToken } from './auth';  // Импортируем функцию получения токена

const API_URL = 'https://skilltestquest.onrender.com/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик запросов для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Токен добавлен к запросу:', token.substring(0, 20) + '...');
    } else {
      console.log('Токен не найден');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Функции для работы с модулями
export const getModules = () => api.get('modules/');
export const getModule = (id) => api.get(`modules/${id}/`);

// Функции для работы с заданиями
export const getTasks = (params = {}) => api.get('tasks/', { params });
export const getTask = (id) => api.get(`tasks/${id}/`);

// Функция для проверки ответа - больше не передаем user_id
export const checkAnswer = (taskId, answer) => {
  return api.post('check-answer/', {
    task_id: taskId,
    answer: answer
    // user_id больше не нужен - берется из токена
  });
};

// Функция для получения прогресса пользователя
export const getUserProgress = (userId) => api.get(`user-progress/${userId}/`);

// Функция для получения статистики пользователя
export const getUserStatistics = () => api.get('user-statistics/');

export default api;

import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

// Сохраняем токены
export const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

// Получаем токен
export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

// Сохраняем имя пользователя
export const setUserInfo = (username) => {
  localStorage.setItem('username', username);
};

// Удаляем токены (выход)
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('username');
};

// Проверяем, авторизован ли пользователь
export const isAuthenticated = () => {
  const token = getAccessToken();
  return !!token;
};

// Получаем информацию о пользователе
export const getUser = () => {
  const token = getAccessToken();
  if (!token) return null;
  
  try {
    // Пробуем получить из токена (user_id)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    
    return {
      id: payload.user_id,
      username: localStorage.getItem('username') || 'User',
    };
  } catch {
    return null;
  }
};

// Регистрация
export const register = async (username, email, password) => {
  const response = await axios.post(API_URL + 'register/', {
    username,
    email,
    password
  });
  return response.data;
};

// Вход
export const login = async (username, password) => {
  const response = await axios.post(API_URL + 'token/', {
    username,
    password
  });
  
  if (response.data.access) {
    setTokens(response.data.access, response.data.refresh);
    setUserInfo(username);
  }
  
  return response.data;
};
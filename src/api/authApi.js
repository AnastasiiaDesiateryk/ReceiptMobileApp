// src/api/authApi.js
import { post } from './apiClient';

// Логин
export async function login(email, password) {
  try {
    const response = await post('/api/auth/login', { email, password });
    const { token, refreshToken, user } = response.data;
    return { token, refreshToken, user };
  } catch (error) {
    console.log('LOGIN ERROR', {
      url: error?.config?.url,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    const message =
      error?.response?.data?.message ||
      'Login failed, please check your credentials.';
    throw new Error(message);
  }
}

// Регистрация (на бэке: /api/auth/register)
export async function signup(email, password, name) {
  try {
    const response = await post('/api/auth/register', {
      email,
      password,
      name,
    });
    const { token, refreshToken, user } = response.data;
    return { token, refreshToken, user };
  } catch (error) {
    console.log('SIGNUP ERROR', {
      url: error?.config?.url,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    const message =
      error?.response?.data?.message ||
      'Signup failed, please try again.';
    throw new Error(message);
  }
}

// Обновление сессии по refresh токену
export async function refreshSession(refreshToken) {
  try {
    const response = await post('/api/auth/refresh', { refreshToken });
    const { token, refreshToken: newRefreshToken, user } = response.data;
    return { token, refreshToken: newRefreshToken, user };
  } catch (error) {
    console.log('REFRESH ERROR', {
      url: error?.config?.url,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    const message =
      error?.response?.data?.message || 'Session refresh failed.';
    throw new Error(message);
  }
}

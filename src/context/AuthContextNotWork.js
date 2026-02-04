// src/context/AuthContext.js
import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  login as apiLogin,
  signup as apiSignup,
  refreshSession,
} from '../api/authApi';

import {
  setAuthTokens,
  clearAuthTokens,
  getStoredRefreshToken,
  setUnauthorizedHandler,
} from '../api/apiClient';

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // при старте мы НЕ знаем, авторизован ли юзер → true
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const handleForceLogout = useCallback(async () => {
    try {
      await clearAuthTokens();
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);
  // ---- Инициализация с диска (refresh при старте) ----
  const loadUserFromStorage = useCallback(async () => {
    console.log('[Auth] init start');//bo

    setLoading(true);
    setError(null);

    try {
      const storedRefreshToken = await getStoredRefreshToken();
      console.log('[Auth] init refreshToken?', !!storedRefreshToken);//bo


      if (!storedRefreshToken) {
        // ничего нет → гость
        setUser(null);
        return;
      }

      // Пытаемся обновить сессию через /auth/refresh
      const { token, refreshToken, user: userData } =
        await refreshSession(storedRefreshToken);
console.log('[Auth] init refresh ok', { hasToken: !!token, hasUser: !!userData });//bo

      await setAuthTokens({ token, refreshToken });
      setUser(userData);
    } catch (e) {
      console.log('[Auth] init refresh FAILED', String(e?.message || e));//bo

      // если refresh упал – чистим всё и считаем, что не авторизован
      await clearAuthTokens();
      setUser(null);
    } finally {
      console.log('[Auth] init done -> loading=false');//bo

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

   // Регистрируем onUnauthorized-handler в apiClient один раз
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // apiClient снаружи не знает ни про user-стейт, ни про UI,
      // он просто вызывает этот коллбек, когда авторизация умерла.
      console.log('[Auth] onUnauthorized -> forceLogout'); //bo

      handleForceLogout();
    });
  }, [handleForceLogout]);

  // ---- LOGIN ----
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { token, refreshToken, user: userData } = await apiLogin(
        normalizedEmail,
        password,
      );

      await setAuthTokens({ token, refreshToken });
      setUser(userData);
    } catch (e) {
      setError(e.message || 'Login failed');
      // пробрасываем дальше, чтобы экран мог показать Alert
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // ---- SIGNUP ----
  const signup = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const nameFromEmail = normalizedEmail.split('@')[0];

      const { token, refreshToken, user: userData } = await apiSignup(
        normalizedEmail,
        password,
        nameFromEmail,
      );

      await setAuthTokens({ token, refreshToken });
      setUser(userData);
    } catch (e) {
      setError(e.message || 'Signup failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // ---- LOGOUT ----
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await clearAuthTokens();
      setUser(null);
    } catch (e) {
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        logout,
        signup,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// src/api/apiClient.js
/**
 * API Client (Enterprise-ish)
 * ---------------------------
 * Цели:
 *  - Централизованный HTTP-клиент поверх axios.
 *  - Поддержка:
 *      * JWT access token в памяти
 *      * Refresh token в secure storage
 *      * Авто-refresh по 401
 *      * Shared request dedupe (объединение одинаковых запросов)
 *      * Circuit Breaker (fail-fast при деградации бэка)
 *      * Exponential retry с jitter для временных сбоев
 *      * Offline fail-fast (не долбим сеть, если нет коннекта)
 *      * Хуки для метрик / аналитики
 *      * Хук для инвалидирования сессии (logout на верхнем уровне)
 */

import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
// import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL, API_TIMEOUT, REFRESH_TOKEN_KEY } from '../../env';

// =========================
//   AUTH STATE (in-memory)
// =========================

// Access-токен живёт только в памяти процесса (не в AsyncStorage, не в EncryptedStorage)
let accessToken = null;

// Refresh-токен живёт в EncryptedStorage (чтобы переживать перезапуск приложения)

// Флаг и очередь для одновременных 401, чтобы не спамить /auth/refresh
let isRefreshing = false;
let refreshQueue = [];

// Коллбек, который может установить верхний уровень (AuthContext),
// чтобы реагировать на 401/403/refresh-fail (инвалидировать сессию)
let onUnauthorized = null;

// =========================
//   CIRCUIT BREAKER STATE
// =========================

/**
 * Circuit Breaker — паттерн, который предотвращает
 * постоянное долбление сломанного бэка.
 *
 * CLOSED     — всё ок, запросы идут.
 * OPEN       — бэк считается "лежачим", запросы сразу фейлятся (fail-fast).
 * HALF_OPEN  — пробуем ограниченное количество запросов после паузы.
 */

const CB_STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

let circuitState = CB_STATE.CLOSED;
let failureCount = 0;
let nextAttemptAllowedAt = 0;

// Порог неудачных попыток, после которого открываем breaker
const CB_MAX_FAILURES = 5;
// Как долго breaker остаётся открытым (в мс)
const CB_OPEN_INTERVAL_MS = 30_000;

// =========================
//   RETRY CONFIG
// =========================

// Максимальное количество ретраев для временных ошибок
const MAX_RETRIES = 3;
// Базовая задержка (мс) для экспоненциального backoff
const RETRY_BASE_DELAY_MS = 200;
// Максимальное время ожидания с учётом backoff (safety)
const RETRY_MAX_DELAY_MS = 5_000;

// =========================
//   REQUEST DEDUP (in-flight)
// =========================

/**
 * Мапа для in-flight запросов:
 * key -> Promise
 * Если несколько вызовов делают один и тот же GET запрос с одинаковыми params —
 * они получат один и тот же Promise и один сетевой вызов.
 */
const inFlightRequests = new Map();

// =========================
//   OFFLINE DETECTION
// =========================

/**
 * Глобальный флаг "мы оффлайн".
 * NetInfo — системный уровень, знает об отсутствии сети до таймаута.
 */
let isOffline = false;

// NetInfo.addEventListener(state => {
//   const disconnected =
//     state.isConnected === false || state.isInternetReachable === false;
//   isOffline = Boolean(disconnected);
// });

// =========================
//   METRICS HOOKS
// =========================

/**
 * Простая система хуков для метрик/логов.
 * Верхний уровень может подменить эти функции и сливать события в Sentry/Datadog/etc.
 */
const metricsHandlers = {
  // (config) => void
  onRequestStart: null,
  // (config, response) => void
  onRequestSuccess: null,
  // (config, error) => void
  onRequestError: null,
  // () => void
  onCircuitOpen: null,
};

/**
 * Позволяет настроить обработчики метрик снаружи.
 */
export function configureApiMetrics(partialHandlers) {
  Object.assign(metricsHandlers, partialHandlers);
}

/**
 * Устанавливаем коллбек, который будет вызван при:
 *  - окончательной потере авторизации (refresh не удался)
 *  - 401/403, которые нельзя восстановить
 * Обычно тут вызывают logout() на уровне AuthContext.
 */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// =========================
//   AUTH TOKEN HELPERS
// =========================

/**
 * Вызывается из AuthContext после login/signup/refresh.
 * Передаёшь сюда то, что вернул бэк (/auth/login, /auth/register, /auth/refresh)
 * { token, refreshToken }
 */
export async function setAuthTokens({ token, refreshToken }) {
  accessToken = token || null;

  if (refreshToken) {
    try {
      await EncryptedStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
      console.warn('[apiClient] Failed to persist refresh token:', e?.message || e);
    }
  }
}

/**
 * Вызывается при явном logout или если refresh сломался.
 */
export async function clearAuthTokens() {
  accessToken = null;
  try {
    await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    // Не критично — токен мог быть уже удалён / storage недоступен
    console.warn('[apiClient] Failed to clear refresh token:', e?.message || e);
  }
}

/**
 * Вытянуть refresh токен (для AuthContext, если надо).
 */
export async function getStoredRefreshToken() {
  try {
    return await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.warn('[apiClient] Failed to read refresh token:', e?.message || e);
    return null;
  }
}

// =========================
//   AXIOS INSTANCE
// =========================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(API_TIMEOUT) || 15_000,
});

// =========================
//   HELPERS
// =========================

const isAuthUrl = url => {
  if (!url) return false;
  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/refresh')
  );
};

/**
 * Утилита для задержки (используется в backoff'е).
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Генерация jitter: добавляем случайный шум к задержке,
 * чтобы не создавать "шип" одновременных ретраев.
 */
const withJitter = baseDelay => {
  const jitter = Math.random() * 100; // 0–100 мс
  return Math.min(baseDelay + jitter, RETRY_MAX_DELAY_MS);
};

/**
 * Дедупликация только для идемпотентных запросов (GET/HEAD).
 * Ключ основан на method + url + params.
 */
const getDedupeKey = config => {
  if (config.dedupe === false) return null;

  const method = (config.method || 'get').toLowerCase();
  if (method !== 'get' && method !== 'head') return null;

  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';

  return `${method}|${url}|${params}`;
};

// =========================
//   CIRCUIT BREAKER LOGIC
// =========================

function isCircuitOpen() {
  if (circuitState === CB_STATE.OPEN) {
    // Проверяем, не истёк ли таймер "отдыха"
    if (Date.now() >= nextAttemptAllowedAt) {
      // Разрешаем одну "пробную" попытку
      circuitState = CB_STATE.HALF_OPEN;
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Фиксируем неудачу в Circuit Breaker.
 * Учитываем только retryable-ошибки (сетевые/5xx).
 */
function recordFailureForCircuit(error) {
  if (!isRetryableError(error)) {
    return;
  }

  failureCount += 1;

  if (failureCount >= CB_MAX_FAILURES && circuitState === CB_STATE.CLOSED) {
    circuitState = CB_STATE.OPEN;
    nextAttemptAllowedAt = Date.now() + CB_OPEN_INTERVAL_MS;
    if (typeof metricsHandlers.onCircuitOpen === 'function') {
      metricsHandlers.onCircuitOpen();
    }
    console.warn(
      `[apiClient] Circuit breaker OPEN — backend considered unhealthy (failures=${failureCount})`,
    );
  }
}

function recordSuccessForCircuit() {
  if (circuitState !== CB_STATE.CLOSED) {
    console.log('[apiClient] Circuit breaker CLOSED — backend looks healthy again');
  }
  circuitState = CB_STATE.CLOSED;
  failureCount = 0;
}

// =========================
//   RETRY LOGIC
// =========================

/**
 * Решаем, стоит ли вообще пытаться retry для данной ошибки.
 * Консервативная стратегия:
 *  - Retry только для:
 *      * сетевых ошибок (нет response)
 *      * 5xx (серверные временные ошибки)
 *  - Только для идемпотентных методов (GET/HEAD)
 *  - Не ретраим, если config.retry === false
 */
function isRetryableError(error, configOverride) {
  const config = error.config || configOverride || {};
  if (config.retry === false) return false;

  const method = (config.method || 'get').toLowerCase();
  if (method !== 'get' && method !== 'head') return false;

  if (!error.response) {
    // Сетевая ошибка (таймаут/нет коннекта)
    return true;
  }

  const status = error.response.status;
  // Серверные ошибки считаем потенциально временными
  return status >= 500 && status < 600;
}

/**
 * Ключевая функция: выполняет запрос с:
 *  - проверкой circuit breaker
 *  - retry/backoff
 */
async function executeWithRetryAndCircuit(config) {
  // Circuit breaker: если OPEN — сразу fail-fast.
  if (isCircuitOpen()) {
    const err = new Error('Circuit breaker is OPEN — backend temporarily unavailable');
    err.code = 'CIRCUIT_OPEN';
    throw err;
  }

  let attempt = 0;

  // Циклический retry
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (typeof metricsHandlers.onRequestStart === 'function') {
        metricsHandlers.onRequestStart(config);
      }

      // Если сигнал уже отменён до начала — уважаем это.
      if (config.signal && config.signal.aborted) {
        const abortError = new Error('Request aborted before start');
        abortError.code = 'ABORTED';
        throw abortError;
      }

      const response = await apiClient.request({ ...config });

      recordSuccessForCircuit();

      if (typeof metricsHandlers.onRequestSuccess === 'function') {
        metricsHandlers.onRequestSuccess(config, response);
      }

      return response;
    } catch (error) {
      if (typeof metricsHandlers.onRequestError === 'function') {
        metricsHandlers.onRequestError(config, error);
      }

      // Если запрос был явно отменён — не ретраим
      if (error.code === 'ABORTED' || (axios.isCancel && axios.isCancel(error))) {
        throw error;
      }

      const canRetry = isRetryableError(error, config) && attempt < MAX_RETRIES;

      if (!canRetry) {
        recordFailureForCircuit(error);
        throw error;
      }

      // Retry: exponential backoff + jitter
      const delay = withJitter(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
      attempt += 1;

      await sleep(delay);

      // Если между попытками circuit оказался OPEN — выходим
      if (isCircuitOpen()) {
        const cbError = new Error('Circuit breaker opened during retries');
        cbError.code = 'CIRCUIT_OPEN';
        throw cbError;
      }
      // цикл пойдёт на следующую попытку
    }
  }
}

// =========================
//   REQUEST WRAPPER (DEDUPE + OFFLINE + RETRIES)
// =========================

/**
 * Высокоуровневый враппер по HTTP-запросу:
 *  - оффлайн fail-fast
 *  - dedupe для GET/HEAD
 *  - executeWithRetryAndCircuit
 */
async function requestWithPolicies(config) {
  // Если мы явно знаем, что оффлайн — не делаем даже попытки.
  if (isOffline && config.allowWhileOffline !== true) {
    const offlineError = new Error('Device is offline');
    offlineError.code = 'OFFLINE';
    throw offlineError;
  }

  const dedupeKey = getDedupeKey(config);

  if (dedupeKey && inFlightRequests.has(dedupeKey)) {
    // Shared in-flight запрос — возвращаем тот же Promise
    return inFlightRequests.get(dedupeKey);
  }

  const promise = executeWithRetryAndCircuit(config);

  if (dedupeKey) {
    inFlightRequests.set(dedupeKey, promise);
    promise.finally(() => {
      inFlightRequests.delete(dedupeKey);
    });
  }

  return promise;
}

// =========================
//   INTERCEPTORS
// =========================

// REQUEST: навешиваем Authorization, если есть accessToken
// bo{
const dbg = (...args) => {
  if (__DEV__) console.log('[apiClient]', ...args);
};
// bo}
apiClient.interceptors.request.use(
  async config => {
    // bo{
    dbg('REQ', {
  method: (config.method || 'get').toUpperCase(),
  url: config.url,
  isAuthUrl: isAuthUrl(config.url),
  hasAccessTokenInMemory: !!accessToken,
  hasAuthHeader: !!config?.headers?.Authorization,
  retry: config?._retry,
});
// bo}
    if (!isAuthUrl(config.url) && accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// helper для очереди refresh'а
function processRefreshQueue(error, newToken = null) {
  refreshQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(newToken);
    }
  });
  refreshQueue = [];
}

// RESPONSE: обработка 401 + refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    // bo{
    dbg('RESP_ERR', {
  url: originalRequest?.url,
  status: error?.response?.status,
  code: error?.code,
  isAuthUrl: isAuthUrl(originalRequest?.url),
  retry: originalRequest?._retry,
  isRefreshing,
  refreshQueueLen: refreshQueue?.length,
});

    // bo}

    // Если нет ответа вообще (сетевой таймаут) — отдаём ошибку в retry-логику выше
    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    // 403 (forbidden) — обычно значит, что токен валиден, но сессия больше не действительна.
    if (
      status === 403 &&
      originalRequest &&
      !isAuthUrl(originalRequest.url)
    ) {
      if (typeof onUnauthorized === 'function') {
        onUnauthorized();
      }
      return Promise.reject(error);
    }

    // Всё, что не 401 — оставляем как есть
    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthUrl(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // 401 на обычном запросе → пробуем refresh
    originalRequest._retry = true;

    if (isRefreshing) {
      // Уже идёт refresh → встаём в очередь и ждём новый токен
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: token => {
            if (token) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          },
          reject: err => {
            reject(err);
          },
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        await clearAuthTokens();
        const err = new Error('No refresh token available');
        processRefreshQueue(err, null);
        isRefreshing = false;
        if (typeof onUnauthorized === 'function') {
          onUnauthorized();
        }
        return Promise.reject(err);
      }

      // ВАЖНО: refresh вызываем без apiClient, чтобы не поймать его же интерцепторы
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        { refreshToken },
        {
          timeout: Number(API_TIMEOUT) || 15_000,
        },
      );

      const { token: newAccessToken, refreshToken: newRefreshToken } =
        refreshResponse.data || {};

      if (!newAccessToken) {
        throw new Error('Refresh response does not contain access token');
      }

      await setAuthTokens({
        token: newAccessToken,
        refreshToken: newRefreshToken,
      });

      isRefreshing = false;
      processRefreshQueue(null, newAccessToken);

      // originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      // после успешного refresh:
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      await clearAuthTokens();
      processRefreshQueue(refreshError, null);
      if (typeof onUnauthorized === 'function') {
        onUnauthorized();
      }
      return Promise.reject(refreshError);
    }
  },
);

// =========================
//   PUBLIC HTTP HELPERS
// =========================

export const get = (url, config = {}) =>
  requestWithPolicies({ method: 'get', url, ...config });

export const post = (url, data, config = {}) =>
  requestWithPolicies({ method: 'post', url, data, ...config });

export const put = (url, data, config = {}) =>
  requestWithPolicies({ method: 'put', url, data, ...config });

export const del = (url, config = {}) =>
  requestWithPolicies({ method: 'delete', url, ...config });

export default apiClient;

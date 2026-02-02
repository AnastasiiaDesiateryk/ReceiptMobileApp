/**
 * Secure Storage Layer
 * ---------------------
 * Это "инфраструктурный слой" (infrastructure layer) для хранения чувствительных данных.
 * Он абстрагирует работу с react-native-encrypted-storage:
 *
 * 1. Изолирует работу с Keychain/Keystore.
 * 2. Централизует обработку ошибок, позволяя остальному приложению не знать
 *    о специфике OS-level secure storage.
 * 3. Предоставляет единый API: get/set/remove + JSON-варианты.
 * 4. Гарантирует fail-safe поведение (ошибки = контрольируемое состояние).
 *
 * Такой модуль обычно называют "SecureStorageAdapter" в чистой архитектуре.
 */

import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * Логгер уровня infrastructure.
 * Здесь НЕ надо использовать Alert или console.error.
 * Мы используем console.warn, чтобы не засорять output.
 * На проде можно заменить на Sentry/Crashlytics.
 */
function logStorageError(operation, key, error) {
  console.warn(
    `[SecureStorage] ${operation} failed for key="${key}":`,
    error?.message || error
  );
}

/**
 * TYPE GUARD: проверяет, что ключ корректный.
 * В инфраструктурных модулях это нормальная практика.
 */
function validateKey(key) {
  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error(`SecureStorage key must be a non-empty string. Got: ${key}`);
  }
}

/**
 * Базовая операция чтения строки.
 * Возвращает:
 *   - string    → данные существуют
 *   - null      → ключ отсутствует / произошла ошибка
 *
 * Никогда не кидает исключения наружу — это намеренное fail-safe поведение.
 */
export async function getItem(key) {
  validateKey(key);

  try {
    const value = await EncryptedStorage.getItem(key);

    // EncryptedStorage возвращает null, если ключ не найден — это корректно.
    return value;
  } catch (e) {
    logStorageError('getItem', key, e);
    return null;
  }
}

/**
 * Базовая операция записи строки.
 * Возвращает:
 *   - true      → запись успешна
 *   - false     → произошла ошибка
 */
export async function setItem(key, value) {
  validateKey(key);

  // Защита от ошибки: EncryptedStorage принимает только строки.
  if (typeof value !== 'string') {
    console.warn(
      `[SecureStorage] Attempted to store non-string value for key="${key}". Converting to string.`
    );
    value = String(value);
  }

  try {
    await EncryptedStorage.setItem(key, value);
    return true;
  } catch (e) {
    logStorageError('setItem', key, e);
    return false;
  }
}

/**
 * Удаление ключа.
 * Возвращает:
 *   - true      → удалено успешно
 *   - false     → ошибка
 */
export async function removeItem(key) {
  validateKey(key);

  try {
    await EncryptedStorage.removeItem(key);
    return true;
  } catch (e) {
    logStorageError('removeItem', key, e);
    return false;
  }
}

/**
 * JSON-friendly API
 * --------------------
 * Два дополнительных метода:
 *   getItemJSON / setItemJSON
 *
 * Они позволяют хранить объекты, не заботясь о сериализации.
 * Любая ошибка при JSON.parse → null (fail-safe).
 */

export async function setItemJSON(key, obj) {
  validateKey(key);

  try {
    const json = JSON.stringify(obj);
    await EncryptedStorage.setItem(key, json);
    return true;
  } catch (e) {
    logStorageError('setItemJSON', key, e);
    return false;
  }
}

export async function getItemJSON(key) {
  validateKey(key);

  try {
    const json = await EncryptedStorage.getItem(key);

    if (!json) return null; // ключ отсутствует

    return JSON.parse(json);
  } catch (e) {
    // Если JSON сломан или storage недоступен — возвращаем null
    logStorageError('getItemJSON', key, e);
    return null;
  }
}

// src/services/logger.js
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const DEFAULT_LEVEL = __DEV__ ? 'debug' : 'info';

function nowIso() {
  return new Date().toISOString();
}

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return '"<unserializable>"';
  }
}

// ✅ named export createLogger
export function createLogger(scope, level = DEFAULT_LEVEL) {
  const min = LEVELS[level] ?? LEVELS.info;

  const base = (lvl, msg, ctx) => {
    if ((LEVELS[lvl] ?? 999) < min) return;

    const line = `[${nowIso()}] [${lvl.toUpperCase()}] [${scope}] ${msg}`;
    const payload = ctx ? ` ${safeJson(ctx)}` : '';

    if (lvl === 'error') console.error(line + payload);
    else if (lvl === 'warn') console.warn(line + payload);
    else console.log(line + payload);
  };

  return {
    debug: (msg, ctx) => base('debug', msg, ctx),
    info: (msg, ctx) => base('info', msg, ctx),
    warn: (msg, ctx) => base('warn', msg, ctx),
    error: (msg, ctx) => base('error', msg, ctx),
  };
}

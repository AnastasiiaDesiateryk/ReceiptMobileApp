// src/services/retryPolicy.js
/**
 * Decide whether an error is retryable.
 * You should adapt it to your API client error format (axios/fetch/etc).
 */
export function isRetryableError(err) {
  // Network errors:
  const msg = String(err?.message ?? err ?? '');
  if (msg.includes('Network') || msg.includes('timeout')) return true;

  // Axios-like:
  const status = err?.response?.status;
  if (status) {
    // Retry on 5xx, and optionally 429.
    if (status >= 500 && status <= 599) return true;
    if (status === 429) return true;
    return false; // 4xx (except 429) = don't retry
  }

  // Unknown shape => treat as retryable once (conservative)
  return true;
}

export function getBackoffMs(attemptIndex) {
  // attemptIndex: 0 -> 3s, 1 -> 10s, 2 -> 30s
  const schedule = [3000, 10000, 30000];
  return schedule[Math.min(attemptIndex, schedule.length - 1)];
}

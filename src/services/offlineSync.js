// src/services/offlineSync.js
import NetInfo from '@react-native-community/netinfo';
import { uploadReceiptImage, saveReceiptData } from '../api/receiptsApi';
import { createLogger } from '../services/logger';
import { fileExists } from './draftFileStore';
import { isRetryableError, getBackoffMs } from './retryPolicy';

const log = createLogger('OfflineSync');

const MAX_ATTEMPTS = 3;

// draftId -> { attempts, timerId, inFlight }
const jobs = new Map();

/**
 * Convert draft => backend payload.
 * Single responsibility: mapping only.
 */
function mapDraftToReceiptData(draft) {
  return {
    merchant: draft.merchant ?? null,
    amountTotal: draft.total != null ? String(draft.total) : null,
    currency: draft.currency ?? null,
    purchaseDate: draft.date ?? null, // 'YYYY-MM-DD' ok if backend expects it
    tags: draft.tags ?? [],
    folder: draft.folder ?? 'Private',
  };
}

/**
 * Try upload once (no retry logic here).
 * Returns { ok: true } OR throws.
 */
async function uploadOnce(draft) {
  const folder = draft.folder ?? 'Private';

  const exists = await fileExists(draft.imageUri);
  if (!exists) {
    const err = new Error('Local file is missing (broken draft)');
    err.code = 'FILE_MISSING';
    throw err;
  }

  log.info('Uploading image...', { draftId: draft.id, folder });

  const uploadResult = await uploadReceiptImage(draft.imageUri, folder);
  if (!uploadResult?.id) {
    const err = new Error('Upload failed: backend did not return receipt id');
    err.code = 'UPLOAD_NO_ID';
    throw err;
  }

  const receiptId = uploadResult.id;
  const data = mapDraftToReceiptData(draft);

  log.info('Saving receipt metadata...', { draftId: draft.id, receiptId });
  await saveReceiptData(receiptId, data);

  log.info('Upload flow finished OK', { draftId: draft.id, receiptId });
  return { ok: true, receiptId };
}

/**
 * Public API: start upload with retry policy.
 *
 * Callbacks:
 * - onSuccess(draftId, receiptId)
 * - onPermanentFailure(draftId, error)
 * - onBrokenDraft(draftId)
 */
export async function enqueueUpload(draft, callbacks = {}) {
  if (!draft?.id || !draft?.imageUri) throw new Error('Invalid draft');

  const existing = jobs.get(draft.id);
  if (existing?.inFlight) {
    log.debug('Skip enqueue: already uploading', { draftId: draft.id });
    return;
  }

  if (!existing) {
    jobs.set(draft.id, { attempts: 0, timerId: null, inFlight: false });
  }

  // Always try immediately
  await runJob(draft, callbacks);
}

async function runJob(draft, callbacks) {
  const job = jobs.get(draft.id);
  if (!job) return;

  // Dedup in-flight
  if (job.inFlight) return;

  // Check connectivity before burning attempt
  const net = await NetInfo.fetch();
  if (!net.isConnected || net.isInternetReachable === false) {
    log.warn('No internet: scheduling retry (no attempt consumed)', { draftId: draft.id });
    scheduleRetry(draft, callbacks, /*consumeAttempt*/ false);
    return;
  }

  job.inFlight = true;

  const correlationId = `${draft.id}:${job.attempts + 1}`;
  log.info('Run upload attempt', { draftId: draft.id, attempt: job.attempts + 1, correlationId });

  try {
    const res = await uploadOnce(draft);

    clearTimer(draft.id);
    jobs.delete(draft.id);

    callbacks?.onSuccess?.(draft.id, res.receiptId);
  } catch (e) {
    const msg = String(e?.message ?? e);
    log.warn('Upload attempt failed', {
      draftId: draft.id,
      attempt: job.attempts + 1,
      error: msg,
      code: e?.code,
      status: e?.response?.status,
    });

    // Broken draft => stop immediately (no retries)
    if (e?.code === 'FILE_MISSING') {
      clearTimer(draft.id);
      jobs.delete(draft.id);
      callbacks?.onBrokenDraft?.(draft.id);
      return;
    }

    const retryable = isRetryableError(e);
    if (!retryable) {
      clearTimer(draft.id);
      jobs.delete(draft.id);
      callbacks?.onPermanentFailure?.(draft.id, e);
      return;
    }

    // Retryable: consume attempt and schedule if still allowed
    job.attempts += 1;

    if (job.attempts >= MAX_ATTEMPTS) {
      log.error('Max attempts reached: stopping retries', { draftId: draft.id });
      clearTimer(draft.id);
      jobs.delete(draft.id);
      callbacks?.onPermanentFailure?.(draft.id, e);
      return;
    }

    scheduleRetry(draft, callbacks, /*consumeAttempt*/ true);
  } finally {
    const j = jobs.get(draft.id);
    if (j) j.inFlight = false;
  }
}

function scheduleRetry(draft, callbacks, consumeAttempt) {
  const job = jobs.get(draft.id);
  if (!job) return;

  // If not consuming attempt (offline), we retry using current attempts index
  const attemptIndex = consumeAttempt ? job.attempts : job.attempts;
  const delay = getBackoffMs(attemptIndex);

  clearTimer(draft.id);

  log.info('Scheduling retry', { draftId: draft.id, inMs: delay, attempts: job.attempts });

  job.timerId = setTimeout(() => {
    runJob(draft, callbacks);
  }, delay);
}

function clearTimer(draftId) {
  const job = jobs.get(draftId);
  if (job?.timerId) {
    clearTimeout(job.timerId);
    job.timerId = null;
  }
}

/**
 * Optional: cancel retries for a draft (e.g. user deletes draft).
 */
export function cancelUpload(draftId) {
  clearTimer(draftId);
  jobs.delete(draftId);
  log.warn('Cancelled upload job', { draftId });
}

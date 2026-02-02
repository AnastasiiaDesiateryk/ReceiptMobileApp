// src/services/draftSessionStore.js
import { createLogger } from '../services/logger';


const log = createLogger('DraftSessionStore');

let drafts = []; // in-memory only

/**
 * Draft shape (минимум):
 * { id, imageUri, folder, merchant, total, currency, date, tags }
 *
 * NOTE: This store is intentionally NOT persistent.
 * App restart => drafts lost (session behavior).
 */
export function getDrafts() {
  return drafts;
}

export function upsertDraft(draft) {
  if (!draft?.id || !draft?.imageUri) {
    throw new Error('Draft must contain id and imageUri');
  }

  const idx = drafts.findIndex(d => d.id === draft.id);
  if (idx >= 0) {
    drafts[idx] = { ...drafts[idx], ...draft };
    log.debug('Updated draft in session store', { id: draft.id });
  } else {
    drafts = [{ ...draft }, ...drafts];
    log.debug('Added draft to session store', { id: draft.id });
  }

  return drafts;
}

export function removeDraft(draftId) {
  if (!draftId) return drafts;
  drafts = drafts.filter(d => d.id !== draftId);
  log.debug('Removed draft from session store', { id: draftId });
  return drafts;
}

export function clearAllDrafts() {
  drafts = [];
  log.warn('Cleared ALL session drafts');
  return drafts;
}

// src/contexts/ReceiptContext.js
import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useContext,
  useRef,
  useMemo,
} from 'react';
import { Alert } from 'react-native';

import {
  fetchReceipts,
  deleteReceipt as apiDeleteReceipt,
  saveReceiptData,
} from '../api/receiptsApi';

import { AuthContext } from './AuthContext';

import { createLogger } from '../services/logger';
import {
  getDrafts,
  upsertDraft,
  removeDraft,
  clearAllDrafts,
} from '../services/draftSessionStore';

import { enqueueUpload, cancelUpload } from '../services/offlineSync';
import { deleteFileIfExists } from '../services/draftFileStore';

const log = createLogger('ReceiptContext');

/**
 * Helpers
 */
function safeError(err) {
  return {
    message: String(err?.message ?? err ?? ''),
    code: err?.code,
    status: err?.response?.status,
    stack: __DEV__ ? String(err?.stack ?? '') : undefined,
  };
}

function makeCorrelationId(prefix = 'rcpt') {
  // stable enough for logs
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const ReceiptContext = createContext({
  receipts: { Private: [], Work: [] },
  drafts: [],
  loading: false,
  error: null,

  addDraft: async () => {},
  updateDraft: async () => {},
  deleteDraft: async () => {},

  refreshReceipts: async () => {},
  deleteReceipt: async () => {},
  saveReceipt: async () => {},

  isUploadingDrafts: false,
});

/**
 * ReceiptProvider
 * Responsibilities:
 * - keep server receipts list
 * - keep session drafts list (in-memory store + state mirror)
 * - orchestrate upload lifecycle via offlineSync
 *
 * NOTE: upload retry logic belongs to offlineSync, not here.
 */
export const ReceiptProvider = ({ children }) => {
  // const { isAuthenticated } = useContext(AuthContext); //bo
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext); //bo


  const [receipts, setReceipts] = useState({ Private: [], Work: [] });
  const [drafts, setDrafts] = useState(() => getDrafts());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination refs (don’t cause re-render)
  const pageRef = useRef({ Private: 1, Work: 1 });
  const totalPagesRef = useRef({ Private: 1, Work: 1 });

  // guard: avoid setState after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // guard: prevent overlapping refreshes
  const refreshInFlightRef = useRef(false);

  // optional: track which draftIds are currently being processed in UI (not required)
  const uploadInFlightDraftIdsRef = useRef(new Set());

  // derived: quick index for receipts, useful for future optimizations
  const receiptsCount = useMemo(
    () => ({
      Private: receipts.Private?.length ?? 0,
      Work: receipts.Work?.length ?? 0,
    }),
    [receipts],
  );

  /**
   * Fetch receipts by folder
   * - logs: start/end, pagination info, errors
   */
  const fetchReceiptsByFolder = useCallback(
    async (folder, page = 1, limit = 20, append = false, correlationId) => {
      if (!isAuthenticated) {
        log.debug('fetchReceiptsByFolder: skipped (not authenticated)', {
          correlationId,
          folder,
        });
        return;
      }

      log.info('fetchReceiptsByFolder: start', {
        correlationId,
        folder,
        page,
        limit,
        append,
      });

      try {
        const data = await fetchReceipts(folder, page, limit);

        const newReceipts = data?.receipts || [];
        const total = data?.total || 0;

        totalPagesRef.current[folder] = Math.ceil(total / limit) || 1;
        pageRef.current[folder] = page;

        if (isMountedRef.current) {
          setReceipts(prev => ({
            ...prev,
            [folder]: append ? [...prev[folder], ...newReceipts] : newReceipts,
          }));
        }

        log.info('fetchReceiptsByFolder: success', {
          correlationId,
          folder,
          received: newReceipts.length,
          total,
          totalPages: totalPagesRef.current[folder],
        });
      } catch (e) {
        const err = safeError(e);
        if (isMountedRef.current) setError(err.message);

        log.error('fetchReceiptsByFolder: failed', {
          correlationId,
          folder,
          error: err,
        });
      }
    },
    [isAuthenticated],
  );

  /**
   * Refresh receipts (both folders)
   * - dedup concurrent refresh calls
   */
  const refreshReceipts = useCallback(async () => {
    const correlationId = makeCorrelationId('refresh');

    if (!isAuthenticated) {
      log.debug('refreshReceipts: skipped (not authenticated)', {
        correlationId,
      });
      return;
    }

    if (refreshInFlightRef.current) {
      log.warn('refreshReceipts: skipped (already in flight)', {
        correlationId,
      });
      return;
    }

    refreshInFlightRef.current = true;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    log.info('refreshReceipts: start', {
      correlationId,
      prevCounts: receiptsCount,
    });

    try {
      await fetchReceiptsByFolder('Private', 1, 20, false, correlationId);
      await fetchReceiptsByFolder('Work', 1, 20, false, correlationId);

      log.info('refreshReceipts: done', {
        correlationId,
      });
    } finally {
      refreshInFlightRef.current = false;
      if (isMountedRef.current) setLoading(false);
    }
  }, [isAuthenticated, fetchReceiptsByFolder, receiptsCount]);
  //bo{
  const refreshReceiptsRef = useRef(() => {});
useEffect(() => {
  refreshReceiptsRef.current = refreshReceipts;
}, [refreshReceipts]);
//bo}
  /**
   * Auth transitions
   * - on login: refresh server data
   * - on logout: clear everything session-based
   */
  
  //bo{
//   useEffect(() => {
//     const correlationId = makeCorrelationId('auth');

//     if (isAuthenticated) {
//       log.info('Auth state: authenticated -> refreshing receipts', {
//         correlationId,
//       });
//       refreshReceipts();
//       return;
//     }

//     // logout
//     log.warn('Auth state: not authenticated -> clearing receipts and drafts', {
//       correlationId,
//     });

//     if (isMountedRef.current) {
//       setReceipts({ Private: [], Work: [] });
//       setError(null);
//       setLoading(false);
//     }

//     // clear session drafts (in-memory)
//     // bo{
//     // clearAllDrafts();
//     // if (isMountedRef.current) setDrafts(getDrafts());

//     // // IMPORTANT:
//     // // If you want: cancel all in-flight jobs on logout
//     // // (You need a list of ids; we have drafts in memory here.)
//     // // We do best-effort: cancel known ids.
//     // try {
//     //   const all = getDrafts();
//     //   for (const d of all) cancelUpload(d.id);
//     // } catch {
//     //   // ignore
//     // }
//     try {
//   const all = getDrafts();
//   console.log('[Receipt] logout: cancelling uploads', all.map(d => d.id));
//   for (const d of all) cancelUpload(d.id);
// } catch {}

// clearAllDrafts();
// if (isMountedRef.current) setDrafts(getDrafts());
//         //bo}

//   }, [isAuthenticated, refreshReceipts]);

useEffect(() => {
  const correlationId = makeCorrelationId('auth');

  // пока AuthContext инициализируется — НЕ ТРОГАЕМ данные
  if (authLoading) return;

  if (isAuthenticated) {
    log.info('Auth state: authenticated -> refreshing receipts', { correlationId });
    refreshReceiptsRef.current();
    return;
  }

  log.warn('Auth state: not authenticated -> clearing receipts and drafts', { correlationId });

  if (isMountedRef.current) {
    setReceipts({ Private: [], Work: [] });
    setError(null);
    setLoading(false);
  }

  try {
    const all = getDrafts();
    console.log('[Receipt] logout: cancelling uploads', all.map(d => d.id));
    for (const d of all) cancelUpload(d.id);
  } catch {}

  clearAllDrafts();
  if (isMountedRef.current) setDrafts(getDrafts());
}, [isAuthenticated, authLoading]);

  // bo}
  /**
   * Add draft
   * Core contract:
   * - update UI immediately (session)
   * - trigger upload immediately
   * - on success: delete local file + remove from UI + refresh receipts
   * - on permanent failure: keep in UI (session)
   */
  const addDraft = useCallback(
    async draft => {
      const correlationId = makeCorrelationId('draft-add');

      // Validation upfront => predictable logs
      if (!draft?.id || !draft?.imageUri) {
        log.error('addDraft: invalid draft input', {
          correlationId,
          draft: { id: draft?.id, imageUri: draft?.imageUri },
        });
        Alert.alert('Error', 'Invalid draft.');
        return;
      }

      // Prevent duplicate uploads for same draft id triggered by UI double-tap
      if (uploadInFlightDraftIdsRef.current.has(draft.id)) {
        log.warn('addDraft: ignored (already in-flight)', {
          correlationId,
          draftId: draft.id,
        });
        return;
      }

      uploadInFlightDraftIdsRef.current.add(draft.id);

      log.info('addDraft: start', {
        correlationId,
        draftId: draft.id,
        folder: draft.folder ?? 'Private',
      });

      try {
        // 1) session store + UI
        upsertDraft(draft);
        if (isMountedRef.current) setDrafts(getDrafts());

        log.debug('addDraft: draft stored in session', {
          correlationId,
          draftId: draft.id,
          draftsCount: getDrafts().length,
        });

        // 2) upload orchestrated by offlineSync (with retry inside)
        await enqueueUpload(draft, {
          onSuccess: async (draftId, receiptId) => {
            const cbCorrelationId = `${correlationId}:success`;

            log.info('addDraft.onSuccess: backend confirmed', {
              correlationId: cbCorrelationId,
              draftId,
              receiptId,
            });

            // find draft before removing (to delete file)
            const d = getDrafts().find(x => x.id === draftId);

            if (d?.imageUri) {
              await deleteFileIfExists(d.imageUri);
              log.info('addDraft.onSuccess: local file deleted', {
                correlationId: cbCorrelationId,
                draftId,
              });
            }

            removeDraft(draftId);

            if (isMountedRef.current) setDrafts(getDrafts());

            log.info('addDraft.onSuccess: draft removed from UI', {
              correlationId: cbCorrelationId,
              draftId,
              draftsCount: getDrafts().length,
            });

            await refreshReceipts();
          },

          onBrokenDraft: async draftId => {
            const cbCorrelationId = `${correlationId}:broken`;

            log.warn('addDraft.onBrokenDraft: local file missing -> removing', {
              correlationId: cbCorrelationId,
              draftId,
            });

            cancelUpload(draftId);

            const d = getDrafts().find(x => x.id === draftId);
            if (d?.imageUri) await deleteFileIfExists(d.imageUri);

            removeDraft(draftId);
            if (isMountedRef.current) setDrafts(getDrafts());
          },

          onPermanentFailure: (draftId, err) => {
            const cbCorrelationId = `${correlationId}:permanent-failure`;

            // IMPORTANT: do NOT delete draft (user can retry manually if you add a button)
            log.error('addDraft.onPermanentFailure: retries exhausted', {
              correlationId: cbCorrelationId,
              draftId,
              error: safeError(err),
            });
          },
        });

        log.info('addDraft: enqueueUpload finished (note: retries may continue internally)', {
          correlationId,
          draftId: draft.id,
        });
      } catch (e) {
        log.error('addDraft: failed', {
          correlationId,
          draftId: draft?.id,
          error: safeError(e),
        });
        Alert.alert('Error', 'Failed to process draft.');
      } finally {
        uploadInFlightDraftIdsRef.current.delete(draft.id);
      }
    },
    [refreshReceipts],
  );

  /**
   * Update draft (session only)
   * NOTE: upload re-trigger is optional; depends on business rules.
   */
  const updateDraft = useCallback(async updatedDraft => {
    const correlationId = makeCorrelationId('draft-update');

    if (!updatedDraft?.id) {
      log.error('updateDraft: invalid input', {
        correlationId,
        id: updatedDraft?.id,
      });
      Alert.alert('Error', 'Invalid draft.');
      return;
    }

    try {
      upsertDraft(updatedDraft);
      if (isMountedRef.current) setDrafts(getDrafts());

      log.info('updateDraft: success', {
        correlationId,
        draftId: updatedDraft.id,
      });

      // If you want edits to trigger re-upload:
      // enqueueUpload(updatedDraft, ...)
    } catch (e) {
      log.error('updateDraft: failed', {
        correlationId,
        draftId: updatedDraft?.id,
        error: safeError(e),
      });
      Alert.alert('Error', 'Failed to update draft.');
    }
  }, []);

  /**
   * Delete draft (user action)
   * - cancel retries
   * - delete local file
   * - remove from session/UI
   */
  const deleteDraft = useCallback(async draftId => {
    const correlationId = makeCorrelationId('draft-delete');

    if (!draftId) return;

    log.info('deleteDraft: start', { correlationId, draftId });

    try {
      cancelUpload(draftId);

      const d = getDrafts().find(x => x.id === draftId);
      if (d?.imageUri) {
        await deleteFileIfExists(d.imageUri);
        log.info('deleteDraft: local file deleted', { correlationId, draftId });
      }

      removeDraft(draftId);
      if (isMountedRef.current) setDrafts(getDrafts());

      log.info('deleteDraft: success', {
        correlationId,
        draftId,
        draftsCount: getDrafts().length,
      });
    } catch (e) {
      log.error('deleteDraft: failed', {
        correlationId,
        draftId,
        error: safeError(e),
      });
      Alert.alert('Error', 'Failed to delete draft.');
    }
  }, []);

  /**
   * Delete receipt (optimistic UI)
   * - logs include rollback path
   */
  const deleteReceipt = useCallback(
    async receiptId => {
      const correlationId = makeCorrelationId('receipt-delete');
      if (!receiptId) return;

      log.info('deleteReceipt: start (optimistic)', { correlationId, receiptId });

      const backup = receipts;

      try {
        if (isMountedRef.current) {
          setReceipts(prev => ({
            Private: prev.Private.filter(r => r.id !== receiptId),
            Work: prev.Work.filter(r => r.id !== receiptId),
          }));
        }

        await apiDeleteReceipt(receiptId);

        log.info('deleteReceipt: backend success', { correlationId, receiptId });
      } catch (e) {
        // rollback
        if (isMountedRef.current) setReceipts(backup);

        log.error('deleteReceipt: failed -> rollback applied', {
          correlationId,
          receiptId,
          error: safeError(e),
        });

        Alert.alert('Error', e?.message || 'Failed to delete receipt.');
      }
    },
    [receipts],
  );

  /**
   * Save receipt metadata (server)
   */
  const saveReceipt = useCallback(
    async (receiptId, data) => {
      const correlationId = makeCorrelationId('receipt-save');
      if (!receiptId) return;

      log.info('saveReceipt: start', { correlationId, receiptId });

      if (isMountedRef.current) setLoading(true);

      try {
        await saveReceiptData(receiptId, data);
        log.info('saveReceipt: backend success', { correlationId, receiptId });

        await refreshReceipts();
      } catch (e) {
        log.error('saveReceipt: failed', {
          correlationId,
          receiptId,
          error: safeError(e),
        });

        Alert.alert('Error', e?.message || 'Failed to save receipt.');
        throw e;
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [refreshReceipts],
  );

  return (
    <ReceiptContext.Provider
      value={{
        receipts,
        drafts,
        loading,
        error,

        addDraft,
        updateDraft,
        deleteDraft,

        refreshReceipts,
        deleteReceipt,
        saveReceipt,

        isUploadingDrafts: false, // old API; can be removed from consumers gradually
      }}
    >
      {children}
    </ReceiptContext.Provider>
  );
};

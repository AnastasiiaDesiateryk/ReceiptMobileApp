// src/services/draftFileStore.js
import RNFS from 'react-native-fs';
import { createLogger } from '../services/logger';


const log = createLogger('DraftFileStore');

export function normalizeFilePath(uriOrPath) {
  if (!uriOrPath) return null;
  return uriOrPath.startsWith('file://') ? uriOrPath.replace('file://', '') : uriOrPath;
}

export async function fileExists(uriOrPath) {
  const path = normalizeFilePath(uriOrPath);
  if (!path) return false;
  try {
    return await RNFS.exists(path);
  } catch (e) {
    log.warn('RNFS.exists failed', { path, error: String(e) });
    return false;
  }
}

export async function deleteFileIfExists(uriOrPath) {
  const path = normalizeFilePath(uriOrPath);
  if (!path) return;

  try {
    const exists = await RNFS.exists(path);
    if (!exists) return;

    await RNFS.unlink(path);
    log.info('Deleted local draft file', { path });
  } catch (e) {
    log.warn('Failed to delete local draft file', { path, error: String(e) });
  }
}

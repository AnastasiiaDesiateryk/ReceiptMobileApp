import EncryptedStorage from 'react-native-encrypted-storage';
import { AUTH_TOKEN_KEY } from '../../env';

export async function getAuthHeaders() {
  try {
    const token = await EncryptedStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  } catch {
    return {};
  }
}

//receiptsApi
import { get, post, put, del } from './apiClient';

export async function uploadReceiptImage(imageUri, folder, meta = {}) {
  try {
    const formData = new FormData();

    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    });

    // Самый совместимый вариант для RN:
    formData.append('metadata', JSON.stringify({ folder, ...meta }));

    const response = await post('/api/receipts', formData);
    return response.data;
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to upload receipt image.';
    throw new Error(msg);
  }
}

export async function pollReceiptStatus(receiptId) {
  try {
    const response = await get(`/api/receipts/${receiptId}`);
    return response.data; // receipt object including status and OCR data
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to fetch receipt status.');
  }
}

export async function saveReceiptData(receiptId, data) {
  try {
    const response = await put(`/api/receipts/${receiptId}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to save receipt data.');
  }
}

export async function fetchReceipts(folder, page = 1, limit = 20) {
  try {
    const response = await get(`/api/receipts`, { params: { folder, page, pageSize: limit } });
    return response.data; // { receipts: [], total: number }
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to fetch receipts.');
  }
}

export async function deleteReceipt(receiptId) {
  try {
    await del(`/api/receipts/${receiptId}`);
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to delete receipt.');
  }
}

export async function getReceiptImageUrl(receiptId) {
  try {
    const response = await get(`/api/receipts/${receiptId}/image-url`);
    return response.data.url; // temporary signed URL
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to get receipt image URL.');
  }
}

export async function getReceiptShareLink(receiptId) {
  try {
    const response = await post(`/api/receipts/${receiptId}/share-link`);
    return response.data.url; // temporary signed share URL
  } catch (error) {
    throw new Error(error?.response?.data?.message || 'Failed to get receipt share link.');
  }
}

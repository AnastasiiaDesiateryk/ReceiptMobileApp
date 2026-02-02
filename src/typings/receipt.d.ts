export interface Receipt {
  id: string;
  merchant: string;
  date: string; // ISO string
  total: number;
  currency: string;
  tags: string[];
  folder: 'Private' | 'Work';
  status: 'Local' | 'Pending OCR' | 'Ready';
  imageUri: string;
  thumbnailUri?: string;
}

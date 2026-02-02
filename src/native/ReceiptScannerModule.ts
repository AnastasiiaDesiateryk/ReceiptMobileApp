import { NativeModules } from "react-native";

export type OCRBlock = {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number; midY?: number };
};

export type OCRResult = {
  blocks: OCRBlock[];
  fullText: string;
};

type ReceiptScannerModuleType = {
  recognizeText(path: string): Promise<OCRResult>;
};

const { ReceiptScannerModule } = NativeModules as {
  ReceiptScannerModule: ReceiptScannerModuleType;
};

export default ReceiptScannerModule;

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

function normalizePath(uri: string) {
  if (!uri) return uri;
  return uri.startsWith("file://") ? uri.replace("file://", "") : uri;
}

export async function runLocalOcr(imageUri: string): Promise<OCRResult> {
  const mod = NativeModules.ReceiptScannerModule as any;

  if (!mod?.recognizeText) {
    // чтобы сразу было ясно, что мост не подключен
    throw new Error("ReceiptScannerModule is not linked (NativeModules is null)");
  }

  const path = normalizePath(imageUri);
  const res = await mod.recognizeText(path);

  return {
    fullText: res?.fullText ?? "",
    blocks: res?.blocks ?? [],
  };
}


// import ReceiptScannerModule, { OCRBlock } from "../native/ReceiptScannerModule";

// function normalizePath(uri: string) {
//   if (!uri) return uri;
//   // если вдруг прилетит file://
//   return uri.startsWith("file://") ? uri.replace("file://", "") : uri;
// }

// export async function runLocalOcr(imageUri: string): Promise<{ text: string; blocks: OCRBlock[]; fullText: string }> {
//   const path = normalizePath(imageUri);
//   const res = await ReceiptScannerModule.recognizeText(path);

//   return {
//     text: res?.fullText ?? "",
//     fullText: res?.fullText ?? "",
//     blocks: res?.blocks ?? [],
//   };
// }

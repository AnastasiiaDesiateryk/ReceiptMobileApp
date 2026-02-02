// import DocumentScanner from 'react-native-document-scanner-plugin';

// export async function autoCropImage(uri) {
//   try {
//     const result = await DocumentScanner.scanImage(uri);
//     if (result?.croppedImage) {
//       return result.croppedImage;
//     }
//     // Fallback: return original if no crop
//     return uri;
//   } catch {
//     throw new Error('Image cropping failed.');
//   }
// }
// ВРЕМЕННАЯ версия без автокропа
export async function autoCropImage(uri) {
  // просто возвращаем исходное фото
  return uri;
}

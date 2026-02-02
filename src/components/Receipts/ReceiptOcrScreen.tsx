import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from "react-native";

import { runLocalOcr } from "../../ocr/LocalOcr";
import ReceiptTextLayout from "../../ocr/ReceiptTextLayout";
import { extractMerchant, extractTotal } from "../../utils/receiptParser";

export default function ReceiptOcrScreen({ route, navigation }: any) {
  const { photoUri } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [ocr, setOcr] = useState<{ fullText: string; blocks: any[] } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!photoUri) {
      Alert.alert("Error", "No receipt image provided.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const res = await runLocalOcr(photoUri);
        if (cancelled) return;

        const fullText = res.fullText ?? "";
        const blocks = res.blocks ?? [];

        setOcr({ fullText, blocks });
        setOpen(true); // ✅ открываем белое окно с текстом "как в чеке"
      } catch (e: any) {
        if (cancelled) return;

        console.warn("OCR error", e?.message ?? e);
        Alert.alert(
          "Smart Fill failed",
          "Could not extract text from the receipt. You can fill fields manually.",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.replace("ReceiptEditor", {
                  imageUri: photoUri,
                  isNew: true,
                }),
            },
          ]
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [photoUri, navigation]);

  const onContinue = () => {
    const fullText = ocr?.fullText ?? "";
    const blocks = ocr?.blocks ?? [];

    // prefill (если надо)
    const merchant = extractMerchant({ fullText, blocks } as any) ?? "";
    const { totalAmount, currency } = extractTotal({ fullText, blocks } as any);

    setOpen(false);

    navigation.replace("ReceiptEditor", {
      imageUri: photoUri,
      isNew: true,
      rawOcrText: fullText,
      receiptData: {
        merchant,
        amountTotal: totalAmount != null ? totalAmount.toFixed(2) : "",
        currency: currency ?? "CHF",
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingTitle}>Processing receipt…</Text>
        <Text style={styles.loadingSub}>Reading text on device…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>OCR result</Text>
            <Text style={styles.headerMeta}>
              {ocr?.blocks?.length ? `${ocr.blocks.length} blocks` : "No text detected"}
            </Text>
          </View>

          <View style={styles.body}>
            {/* ✅ вот тут “как в чеке” по x/y */}
            <ReceiptTextLayout blocks={(ocr?.blocks ?? []) as any} />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setOpen(false)}>
              <Text style={styles.btnGhostText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onContinue}>
              <Text style={styles.btnPrimaryText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* запасной экран, если модал закрыли */}
      <View style={styles.loading}>
        <Text style={styles.loadingTitle}>OCR finished</Text>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => setOpen(true)}>
          <Text style={styles.btnPrimaryText}>Show OCR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingTitle: { marginTop: 12, fontSize: 18, fontWeight: "700", color: "#222" },
  loadingSub: { marginTop: 6, fontSize: 14, color: "#555" },

  sheet: { flex: 1, backgroundColor: "white" },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    backgroundColor: "white",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  headerMeta: { marginTop: 4, fontSize: 12, color: "#666" },

  body: { flex: 1, backgroundColor: "white" },

  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    backgroundColor: "white",
  },

  btn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: { backgroundColor: "#f2f2f2" },
  btnGhostText: { color: "#111", fontWeight: "800" },

  btnPrimary: { backgroundColor: "#4a90e2" },
  btnPrimaryText: { color: "white", fontWeight: "900" },
});




// import React, { useEffect } from "react";
// import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";

// import { runLocalOcr } from "../../ocr/LocalOcr";
// import { extractMerchant, extractTotal } from "../../utils/receiptParser";

// export default function ReceiptOcrScreen({ route, navigation }: any) {
//   const { photoUri } = route.params || {};

//   useEffect(() => {
//     if (!photoUri) {
//       Alert.alert("Error", "No receipt image provided.", [
//         { text: "OK", onPress: () => navigation.goBack() },
//       ]);
//       return;
//     }

//     let cancelled = false;

//     (async () => {
//       try {
//         const ocr = await runLocalOcr(photoUri);
//         if (cancelled) return;

//         const fullText = ocr.fullText || "";
//         const merchant = extractMerchant(ocr) ?? "";
//         const { totalAmount, currency } = extractTotal(ocr);

//         // чтобы Alert не лагал на огромном тексте
//         const preview = fullText ? fullText.slice(0, 3500) : "(no text detected)";

//         Alert.alert(
//           "OCR result",
//           preview,
//           [
//             {
//               text: "Continue",
//               onPress: () => {
//                 navigation.replace("ReceiptEditor", {
//                   imageUri: photoUri,
//                   isNew: true,
//                   rawOcrText: fullText,
//                   receiptData: {
//                     merchant,
//                     amountTotal: totalAmount != null ? totalAmount.toFixed(2) : "",
//                     currency: currency ?? "CHF",
//                   },
//                 });
//               },
//             },
//           ],
//           { cancelable: false }
//         );
//       } catch (e: any) {
//         if (cancelled) return;

//         console.warn("OCR error", e?.message ?? e);
//         Alert.alert(
//           "Smart Fill failed",
//           e?.message?.includes("not linked")
//             ? "Native OCR module is not linked in Xcode (ReceiptScannerModule is null)."
//             : "Could not extract text from the receipt. You can fill fields manually.",
//           [
//             {
//               text: "OK",
//               onPress: () =>
//                 navigation.replace("ReceiptEditor", {
//                   imageUri: photoUri,
//                   isNew: true,
//                 }),
//             },
//           ]
//         );
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [photoUri, navigation]);

//   // UI пока крутится OCR
//   return (
//     <View style={styles.container}>
//       <ActivityIndicator size="large" />
//       <Text style={styles.title}>Processing receipt…</Text>
//       <Text style={styles.subtitle}>Reading text on device…</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#f5f5f5" },
//   title: { marginTop: 16, fontSize: 18, fontWeight: "700", color: "#222" },
//   subtitle: { marginTop: 8, fontSize: 14, color: "#555", textAlign: "center" },
// });

import React, { useMemo } from "react";
import { ScrollView, Text } from "react-native";

type OCRWord = {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
};

function median(nums: number[]) {
  const a = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

export default function ReceiptTextLayout({ blocks }: { blocks: OCRWord[] }) {
  const out = useMemo(() => {
    const words = blocks
      .filter((b) => b.text?.trim()?.length)
      .filter((b) => (b.confidence ?? 1) >= 0.15)
      .map((b) => {
        const x = b.bbox.x;
        const yMid = b.bbox.y + b.bbox.h / 2; // Vision bottom-left
        return { text: b.text.replace(/\s+/g, " ").trim(), x, yMid, h: b.bbox.h, w: b.bbox.w };
      });

    if (!words.length) return "No OCR words";

    const medH = median(words.map((w) => w.h));
    const yTol = Math.max(0.004, medH * 0.65); // строки по высоте текста

    // 1) бакетизация строк по yMid
    const lineMap = new Map<number, Array<{ text: string; x: number }>>();
    for (const w of words) {
      const key = Math.floor(w.yMid / yTol);
      const arr = lineMap.get(key) ?? [];
      arr.push({ text: w.text, x: w.x });
      lineMap.set(key, arr);
    }

    const keys = Array.from(lineMap.keys()).sort((a, b) => b - a);

    // 2) сборка строк с имитацией колонок через x-gap
    const receiptCols = 48;

    const lines: string[] = [];
    for (const k of keys) {
      const arr = lineMap.get(k)!;
      arr.sort((a, b) => a.x - b.x);

      // печать в “сетку” символов
      const row = Array.from({ length: receiptCols }, () => " ");

      // коэффициент: x(0..1) -> col(0..cols-1)
      const toCol = (x: number) => Math.max(0, Math.min(receiptCols - 1, Math.round(x * (receiptCols - 1))));

      let lastCol = 0;
      for (const t of arr) {
        let col = toCol(t.x);

        // если слово попадает в уже занятое место — двигаем вправо
        col = Math.max(col, lastCol);

        const s = t.text;
        for (let i = 0; i < s.length && col + i < receiptCols; i++) {
          row[col + i] = s[i];
        }

        lastCol = Math.min(receiptCols - 1, col + s.length + 1);
      }

      const line = row.join("").replace(/\s+$/g, "");
      if (line.trim().length) lines.push(line);
    }

    return lines.join("\n");
  }, [blocks]);

  return (
  <ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    showsVerticalScrollIndicator
  >
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      contentContainerStyle={{ paddingRight: 16 }}
    >
      <Text
        style={{
          fontFamily: "Menlo",
          fontSize: 12,      // ✅ меньше шрифт (поставь 10–14)
          lineHeight: 14,    // ✅ подогнать под fontSize
          textAlign: "left",
        }}
      >
        {out}
      </Text>
    </ScrollView>
  </ScrollView>
);

}

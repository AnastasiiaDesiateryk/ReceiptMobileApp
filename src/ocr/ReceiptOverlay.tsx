import React, { useMemo, useState } from "react";
import { View, Text, Image, LayoutChangeEvent } from "react-native";

type OCRBlock = {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number }; // normalized 0..1
};

type Props = {
  imagePath: string;
  blocks: OCRBlock[];
};

export default function ReceiptOverlay({ imagePath, blocks }: Props) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  };

  // Vision bbox: origin is bottom-left. RN layout: origin is top-left.
  // So we flip Y: top = (1 - (y + h)) * H
  const positioned = useMemo(() => {
    if (!box) return [];
    const W = box.w;
    const H = box.h;

    return blocks.map((b, idx) => {
      const left = b.bbox.x * W;
      const top = (1 - (b.bbox.y + b.bbox.h)) * H;
      const width = b.bbox.w * W;
      const height = b.bbox.h * H;

      // простая отсечка мусора
      if (!b.text?.trim()) return null;

      // базовый размер шрифта по высоте bbox
      const fontSize = Math.max(10, Math.min(22, height * 0.85));

      return {
        key: `${idx}`,
        text: b.text,
        left,
        top,
        width,
        height,
        fontSize,
        confidence: b.confidence,
      };
    }).filter(Boolean) as any[];
  }, [blocks, box]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <Image
          source={{ uri: "file://" + imagePath }}
          style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, resizeMode: "contain" }}
        />

        {/* Overlay layer */}
        {box &&
          positioned.map((p) => (
            <View
              key={p.key}
              style={{
                position: "absolute",
                left: p.left,
                top: p.top,
                width: p.width,
                height: p.height,
                overflow: "hidden",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  fontSize: p.fontSize,
                  lineHeight: p.fontSize + 2,
                  // если хочешь “чище” — можно opacity от confidence:
                  opacity: Math.max(0.35, Math.min(1, p.confidence)),
                }}
              >
                {p.text}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
}

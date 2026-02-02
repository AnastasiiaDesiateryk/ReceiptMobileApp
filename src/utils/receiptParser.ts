import type { OCRResult } from "../ocr/LocalOcr";

function normLine(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function parseMoney(raw: string): number | null {
  const m = raw.match(/(\d{1,3}(?:[’'\s]\d{3})*(?:[.,]\d{2}))/);
  if (!m) return null;
  const cleaned = m[1].replace(/[’'\s]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function detectCurrency(text: string): string | null {
  const t = text.toUpperCase();
  if (t.includes("CHF")) return "CHF";
  if (t.includes("EUR") || t.includes("€")) return "EUR";
  if (t.includes("USD") || t.includes("$")) return "USD";
  return null;
}

export function extractMerchant(ocr: OCRResult): string | null {
  const lines = (ocr.fullText || "")
    .split("\n")
    .map(normLine)
    .filter(Boolean);

  if (!lines.length) return null;

  const first = lines[0];
  if (first.length > 2 && first.length <= 40) return first;

  const alt = lines.find((l) => l.length > 2 && l.length <= 40);
  return alt ?? null;
}

export function extractTotal(ocr: OCRResult): { totalAmount: number | null; currency: string | null } {
  const lines = (ocr.fullText || "")
    .split("\n")
    .map(normLine)
    .filter(Boolean);

  const cur = detectCurrency(ocr.fullText || "");
  if (!lines.length) return { totalAmount: null, currency: cur };

  const priority = [/TOTAL/i, /SUMME/i, /GESAMT/i, /AMOUNT/i, /DUE/i, /TO\s*PAY/i, /ZAHLEN/i, /ZAHLUNG/i];

  const candidates = lines.filter((l) => priority.some((r) => r.test(l)));
  const pool = candidates.length ? candidates : lines.slice(-8);

  const nums = pool
    .map((l) => parseMoney(l))
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));

  if (!nums.length) return { totalAmount: null, currency: cur };

  return { totalAmount: Math.max(...nums), currency: cur };
}

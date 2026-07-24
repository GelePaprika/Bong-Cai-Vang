export const BASE_FAMILY_SIZE = 5;

const PIECE_UNITS = new Set([
  "",
  "piece",
  "pieces",
  "pc",
  "pcs",
  "egg",
  "eggs",
  "clove",
  "cloves",
  "bunch",
  "bunches",
  "sprig",
  "sprigs",
  "leaf",
  "leaves",
  "slice",
  "slices",
  "stalk",
  "stalks",
  "can",
  "cans",
  "packet",
  "packets",
  "pack",
  "packs",
  "whole",
  "head",
  "heads",
  "sheet",
  "sheets",
]);

const TBSP_UNITS = new Set(["tbsp", "tbs", "tablespoon", "tablespoons", "muỗng canh"]);
const TSP_UNITS = new Set(["tsp", "teaspoon", "teaspoons", "muỗng cà phê"]);
const MASS_VOL_UNITS = new Set([
  "g",
  "gram",
  "grams",
  "gr",
  "ml",
  "milliliter",
  "milliliters",
  "millilitre",
  "millilitres",
  "cc",
]);

function parseQty(raw?: string): { value: number; suffix: string } | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  // fractions like "1/2" or "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (mixed) {
    const v = parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
    return { value: v, suffix: s.slice(mixed[0].length).trim() };
  }
  const frac = s.match(/^(\d+)\/(\d+)/);
  if (frac) {
    return { value: parseInt(frac[1]) / parseInt(frac[2]), suffix: s.slice(frac[0].length).trim() };
  }
  const num = s.match(/^(\d+(?:[.,]\d+)?)/);
  if (!num) return null;
  return { value: parseFloat(num[1].replace(",", ".")), suffix: s.slice(num[0].length).trim() };
}

function roundTo(v: number, step: number) {
  return Math.round(v / step) * step;
}

function formatNumber(v: number): string {
  if (Number.isInteger(v)) return String(v);
  // one decimal, strip trailing zero
  return (Math.round(v * 10) / 10).toString();
}

export function scaleQuantity(
  quantity: string | undefined,
  unit: string | undefined,
  factor: number,
): string | undefined {
  const parsed = parseQty(quantity);
  if (!parsed) return quantity;
  const u = (unit ?? "").trim().toLowerCase();
  let scaled = parsed.value * factor;

  let rounded: number;
  if (TBSP_UNITS.has(u)) rounded = roundTo(scaled, 0.5);
  else if (TSP_UNITS.has(u)) rounded = roundTo(scaled, 0.25);
  else if (MASS_VOL_UNITS.has(u)) rounded = roundTo(scaled, 10);
  else if (PIECE_UNITS.has(u)) rounded = Math.max(1, Math.round(scaled));
  else if (scaled >= 20) rounded = roundTo(scaled, 10);
  else rounded = Math.round(scaled * 2) / 2;

  if (rounded <= 0) rounded = scaled < 0.25 ? scaled : 0.25;

  const out = formatNumber(rounded);
  return parsed.suffix ? `${out} ${parsed.suffix}` : out;
}

export function scaleIngredients<
  T extends { quantity?: string; unit?: string },
>(items: T[], targetSize: number, baseSize: number = BASE_FAMILY_SIZE): T[] {
  const factor = targetSize / baseSize;
  if (factor === 1) return items;
  return items.map((it) => ({
    ...it,
    quantity: scaleQuantity(it.quantity, it.unit, factor),
  }));
}

export function scaleShoppingList<T extends { quantity?: string }>(
  items: T[],
  targetSize: number,
  baseSize: number = BASE_FAMILY_SIZE,
): T[] {
  const factor = targetSize / baseSize;
  if (factor === 1) return items;
  return items.map((it) => {
    if (!it.quantity) return it;
    // try split "500 g" style
    const m = it.quantity.trim().match(/^(\S+)\s+(.*)$/);
    if (m && /[\d/.]/.test(m[1])) {
      return { ...it, quantity: scaleQuantity(m[1], m[2], factor) };
    }
    return { ...it, quantity: scaleQuantity(it.quantity, "", factor) };
  });
}

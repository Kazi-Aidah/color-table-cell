import { debugWarn } from "./constants";
import type { CellDataStore, CellColorData, ColoringRule } from "./types";

/**
 * Normalize raw saved data to extract the cellData object,
 * unwrapping any legacy wrapper keys.
 */
export function normalizeCellData(obj: any): CellDataStore {
  if (!obj) return {};
  if (obj.cellData && typeof obj.cellData === "object") {
    return obj.cellData as CellDataStore;
  }
  // If cellData is missing but there are other keys, the object itself might be the cellData
  if (obj.settings) {
    return {}; // settings exists but cellData doesn't
  }
  return obj as CellDataStore;
}

/** Convert hex color string to HSV components */
export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substr(1, 2), 16);
    g = parseInt(hex.substr(3, 2), 16);
    b = parseInt(hex.substr(5, 2), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, v };
}

/** Convert HSV components to hex color string */
export function hsvToHex(h: number, s: number, v: number): string {
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.round(x * 255).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

/** Get the visible text content of a table cell */
export function getCellText(cell: HTMLElement): string {
  return (cell.innerText || "").trim();
}

/** Check if an element is visible in the DOM */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;
  if (!element.isConnected) return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

/** Get a signature for a table based on its structure */
export function getTableSignature(table: HTMLElement): string {
  const rows = table.querySelectorAll("tr").length;
  const firstRow = table.querySelector("tr");
  const cols = firstRow ? firstRow.querySelectorAll("td, th").length : 0;
  return `${rows}x${cols}`;
}

/** Evaluate whether a cell's text matches a coloring rule */
export function evaluateMatch(
  text: string,
  rule: Pick<ColoringRule, "match" | "value">,
): boolean {
  const val = rule.value != null ? String(rule.value) : "";
  const t = text ?? "";
  const isEmpty = t.trim() === "";

  const toNumber = (s: string): number => {
    const cleaned = s.replace(/[^0-9.\-]/g, "");
    return parseFloat(cleaned);
  };

  switch (rule.match) {
    case "is":
      return t.toLowerCase() === val.toLowerCase();
    case "isNot":
      return t.toLowerCase() !== val.toLowerCase();
    case "isRegex": {
      try {
        return new RegExp(val, "i").test(t);
      } catch {
        return false;
      }
    }
    case "contains":
      return t.toLowerCase().includes(val.toLowerCase());
    case "notContains":
      return !t.toLowerCase().includes(val.toLowerCase());
    case "startsWith":
      return t.toLowerCase().startsWith(val.toLowerCase());
    case "endsWith":
      return t.toLowerCase().endsWith(val.toLowerCase());
    case "notStartsWith":
      return !t.toLowerCase().startsWith(val.toLowerCase());
    case "notEndsWith":
      return !t.toLowerCase().endsWith(val.toLowerCase());
    case "isEmpty":
      return isEmpty;
    case "isNotEmpty":
      return !isEmpty;
    case "eq": {
      const n = toNumber(t), v = toNumber(val);
      return !isNaN(n) && !isNaN(v) && n === v;
    }
    case "gt": {
      const n = toNumber(t), v = toNumber(val);
      return !isNaN(n) && !isNaN(v) && n > v;
    }
    case "lt": {
      const n = toNumber(t), v = toNumber(val);
      return !isNaN(n) && !isNaN(v) && n < v;
    }
    case "ge": {
      const n = toNumber(t), v = toNumber(val);
      return !isNaN(n) && !isNaN(v) && n >= v;
    }
    case "le": {
      const n = toNumber(t), v = toNumber(val);
      return !isNaN(n) && !isNaN(v) && n <= v;
    }
    default:
      return false;
  }
}

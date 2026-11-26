// Colors the AI may use. Anything else is ignored, so no arbitrary CSS can get in.
export const PALETTE: Record<string, string> = {
  red: "#d64545",
  orange: "#e8833a",
  amber: "#d9a21b",
  green: "#4f9d69",
  teal: "#2f9e94",
  blue: "#3b82c4",
  purple: "#8b5fbf",
  pink: "#d4608f",
  gray: "#6b7280",
};

const HEX = /^#[0-9a-f]{6}$/;

export function resolveColor(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (Object.hasOwn(PALETTE, v)) return PALETTE[v];
  return HEX.test(v) ? v : undefined;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Text color with the better contrast on a solid background of this color.
export function readableOn(hex: string): string {
  const l = luminance(hex);
  const white = 1.05 / (l + 0.05);
  const dark = (l + 0.05) / (0.0128 + 0.05);
  return white >= dark ? "#ffffff" : "#1f1e1d";
}

export const soft = (c: string) => `color-mix(in srgb, ${c} 12%, var(--card))`;
export const softBorder = (c: string) =>
  `color-mix(in srgb, ${c} 40%, var(--border))`;
// Keeps colored text readable in both light and dark mode.
export const ink = (c: string) => `color-mix(in srgb, ${c} 80%, var(--foreground))`;

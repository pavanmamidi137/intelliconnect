import type { SiteTheme } from "@/types";

/* ------------------------------------------------------------------ hex */

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Mix hex `a` toward hex `b` by `weight` (0 = pure a, 1 = pure b). */
export function mixHex(a: string, b: string, weight: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  if (!ca || !cb) return a;
  return rgbToHex(
    ca[0] + (cb[0] - ca[0]) * weight,
    ca[1] + (cb[1] - ca[1]) * weight,
    ca[2] + (cb[2] - ca[2]) * weight
  );
}

/** Relative luminance (WCAG-ish) — used to pick readable foreground colors. */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white text color, whichever reads better on `hex`. */
export function contrastText(hex: string): string {
  return luminance(hex) > 0.42 ? "#0f172a" : "#ffffff";
}

/* ------------------------------------------------------- derived palette */

/**
 * Compute the full set of CSS variables for a theme row. Empty color
 * fields fall back to the built-in design-system defaults so a theme can
 * be partially customized.
 */
export function buildThemeVars(theme: SiteTheme): Record<string, string> {
  const primary = theme.primary_color || "#2563eb";
  const accent = theme.accent_color || "#0ea5e9";
  const lightBg = theme.light_background || "#ffffff";
  const darkBg = theme.dark_background || "#0b1120";
  const radius = theme.radius || "0.75rem";

  const lightAccentBg = mixHex(primary, "#ffffff", 0.93);
  const lightAccentFg = mixHex(primary, "#000000", 0.3);
  const lightVioletSoft = mixHex(accent, "#ffffff", 0.93);
  const darkAccentBg = mixHex(primary, darkBg, 0.75);
  const darkAccentFg = mixHex(primary, "#ffffff", 0.55);
  const darkVioletSoft = mixHex(accent, darkBg, 0.85);

  const radiusVars = {
    "--radius": radius,
    "--radius-sm": `calc(${radius} - 4px)`,
    "--radius-md": `calc(${radius} - 2px)`,
    "--radius-lg": radius,
    "--radius-xl": `calc(${radius} + 4px)`,
    "--radius-2xl": `calc(${radius} + 8px)`,
  };

  return {
    ...radiusVars,
    "--primary": primary,
    "--primary-foreground": contrastText(primary),
    "--ring": primary,
    "--violet": accent,
    "--violet-soft": lightVioletSoft,
    "--accent": lightAccentBg,
    "--accent-foreground": lightAccentFg,
    "--background": lightBg,
    "--card": lightBg,
    "--popover": lightBg,
    "--shadow-glow": `0 0 0 1px ${primary}1f, 0 12px 40px -8px ${primary}59`,
    "--dark-accent": darkAccentBg,
    "--dark-accent-foreground": darkAccentFg,
    "--dark-violet-soft": darkVioletSoft,
    "--dark-background": darkBg,
    "--dark-card": darkBg,
    "--dark-popover": darkBg,
  };
}

const FONT_CSS: Record<string, string> = {
  default: `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif`,
  system: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  serif: `Georgia, "Times New Roman", "Noto Serif", serif`,
  mono: `ui-monospace, "Cascadia Code", "SF Mono", Consolas, "Liberation Mono", monospace`,
};

export function fontCss(fontFamily: string): string {
  return FONT_CSS[fontFamily] ?? FONT_CSS.default;
}

/* ------------------------------------------------------------ apply to DOM */

function rgbaFromHex(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function cssValue(value: string): string {
  return /^#?[0-9a-f]{6}$/i.test(value.trim()) ? `#${value.trim().replace(/^#/, "")}` : value;
}

/**
 * Inject the theme as CSS custom properties. A dedicated <style> tag is
 * appended to <head> after the app stylesheet so its :root / .dark rules
 * win at equal specificity, and the font is mirrored onto <body> so text
 * inherits it even where utilities inline their own values.
 */
export function applySiteTheme(theme: SiteTheme): void {
  if (typeof window === "undefined") return;

  const vars = buildThemeVars(theme);

  const shared = Object.entries(vars)
    .filter(([key]) => !key.startsWith("--dark-"))
    .map(([key, value]) => `${key}: ${cssValue(value)};`)
    .join("\n  ");

  const darkOnly = Object.entries(vars)
    .filter(([key]) => key.startsWith("--dark-"))
    .map(([key, value]) => `${key.replace("--dark-", "--")}: ${cssValue(value)};`)
    .join("\n  ");

  const css = `:root {\n  ${shared}\n}\n.dark {\n  ${darkOnly}\n}`;

  let style = document.getElementById("site-theme-style") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "site-theme-style";
    document.head.appendChild(style);
  }
  style.textContent = css;

  // Font — mirrored onto <body> inline so inherited text always picks it up.
  document.documentElement.style.setProperty("--font-sans", fontCss(theme.font_family));
  document.body.style.fontFamily = fontCss(theme.font_family);

  // Tint the selection color and hero grid so they follow the brand.
  const brand = theme.primary_color || "#2563eb";
  const selectionCss = `::selection { background: ${rgbaFromHex(brand, 0.25)}; }`;
  let sel = document.getElementById("site-theme-selection") as HTMLStyleElement | null;
  if (!sel) {
    sel = document.createElement("style");
    sel.id = "site-theme-selection";
    document.head.appendChild(sel);
  }
  sel.textContent = selectionCss;
}

/** True when the theme row carries no customization at all. */
export function isDefaultTheme(theme: SiteTheme): boolean {
  return (
    !theme.primary_color &&
    !theme.accent_color &&
    !theme.light_background &&
    !theme.dark_background &&
    (theme.radius === "0.75rem" || !theme.radius) &&
    (theme.font_family === "default" || !theme.font_family)
  );
}

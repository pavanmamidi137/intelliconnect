import { API_URL } from "@/lib/constants";

export const runtime = "nodejs";

/** Default brand colors — used when the theme API is unreachable. */
const DEFAULT_PRIMARY = "#2563EB";
const DEFAULT_ACCENT = "#0EA5E9";

interface ThemePayload {
  primary_color?: string;
  accent_color?: string;
}

function cleanHex(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const match = /^#?([0-9a-fA-F]{6})$/.exec(value.trim());
  return match ? `#${match[1].toUpperCase()}` : fallback;
}

/**
 * The favicon is served dynamically so the browser tab icon follows the
 * super-admin brand (same mark as LogoMark). Responses are cached for a
 * few minutes and revalidated on demand.
 */
export async function GET() {
  let primary = DEFAULT_PRIMARY;
  let accent = DEFAULT_ACCENT;

  try {
    const response = await fetch(`${API_URL}/settings/theme/`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (response.ok) {
      const theme = (await response.json()) as ThemePayload;
      primary = cleanHex(theme.primary_color, DEFAULT_PRIMARY);
      accent = cleanHex(theme.accent_color, DEFAULT_ACCENT);
    }
  } catch {
    // Fall back to the default brand — the icon is cosmetic.
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop stop-color="${primary}"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#g)"/>
  <circle cx="13" cy="12" r="3.4" fill="white"/>
  <circle cx="27" cy="12" r="3.4" fill="white" fill-opacity="0.55"/>
  <circle cx="13" cy="28" r="3.4" fill="white" fill-opacity="0.55"/>
  <circle cx="27" cy="28" r="3.4" fill="white"/>
  <circle cx="20" cy="20" r="4.6" fill="white"/>
  <path d="M13 12h14M13 12l7 8m7-8l-7 8m-7 8h14m-14 0l7-8m7 8l-7-8" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.75"/>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

export interface WidgetTheme {
  background: string;
  border: string;
  title: string;
  text: string;
  value: string;
  accent: string;
}

export type ThemeName = keyof typeof themes;

export const themes = {
  default: {
    background: "#0d1117",
    border: "#30363d",
    title: "#a371f7",
    text: "#e6edf3",
    value: "#ffffff",
    accent: "#58a6ff",
  },
  dark: {
    background: "#000000",
    border: "#333333",
    title: "#ffffff",
    text: "#cccccc",
    value: "#ffffff",
    accent: "#ffffff",
  },
  ocean: {
    background: "#071a2b",
    border: "#164e63",
    title: "#67e8f9",
    text: "#bae6fd",
    value: "#ffffff",
    accent: "#22d3ee",
  },
  sunset: {
    background: "#1a1917",
    border: "#5c3328",
    title: "#ff7c61",
    text: "#e6ded7",
    value: "#fffaf5",
    accent: "#8ee0c0",
  },
  // Deep Cyberpunk / Neon Synth
  cyberpunk: {
    background: "#0d0f18",
    border: "#1f2438",
    title: "#ff2a6d",
    text: "#05d9e8",
    value: "#ffffff",
    accent: "#d1f7ff",
  },

  // Midnight OLED / Ultra Minimal
  midnight: {
    background: "#090a0f",
    border: "#1b1e2e",
    title: "#a78bfa",
    text: "#94a3b8",
    value: "#f8fafc",
    accent: "#38bdf8",
  },

  // Tokyo Night / Sleek Developer Aesthetic
  tokyoNight: {
    background: "#1a1b26",
    border: "#292e42",
    title: "#7aa2f7",
    text: "#a9b1d6",
    value: "#c0caf5",
    accent: "#bb9af7",
  },

  // Emerald Matrix / Dark Forest
  emerald: {
    background: "#061412",
    border: "#123832",
    title: "#34d399",
    text: "#6ee7b7",
    value: "#ecfdf5",
    accent: "#059669",
  },

  // Sunset Glow / Warm Dark Mode
  sunsetGlow: {
    background: "#120e16",
    border: "#2a1e35",
    title: "#ff70a6",
    text: "#ff9770",
    value: "#ffd670",
    accent: "#e9ff70",
}
} satisfies Record<string, WidgetTheme>;

export function resolveTheme(name?: string): WidgetTheme {
  return themes[name as ThemeName] ?? themes.default;
}

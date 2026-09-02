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
} satisfies Record<string, WidgetTheme>;

export function resolveTheme(name?: string): WidgetTheme {
  return themes[name as ThemeName] ?? themes.default;
}

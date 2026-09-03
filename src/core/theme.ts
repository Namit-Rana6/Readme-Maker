/**
 * Theme types and re-exports — single source of truth lives in themes.js so
 * the Vercel API handlers can import it without TypeScript compilation.
 */
// @ts-expect-error — plain JS module
import { themes as _themes, resolveTheme as _resolveTheme } from "./themes.js";

export interface WidgetTheme {
  background: string;
  border: string;
  title: string;
  text: string;
  value: string;
  accent: string;
}

export const themes = _themes as Record<string, WidgetTheme>;

export type ThemeName = keyof typeof themes;

export function resolveTheme(name?: string): WidgetTheme {
  return _resolveTheme(name) as WidgetTheme;
}

export interface LanguageEntry {
  name: string;
  size: number;
  color: string;
  percentage: number;
}

export interface TopLanguagesData {
  username?: string;
  languages: LanguageEntry[];
}

export type LanguagesLayout =
  | "donut"
  | "donut-vertical"
  | "compact"
  | "bar"
  | "stacked"
  | "horizontal-list"
  | "vertical-list"
  | "grid"
  | "treemap"
  | "pie-list";

export interface TopLanguagesConfig {
  title?: string;
  hideTitle?: boolean;
  centreTitle?: boolean;
  hideBorder?: boolean;
  borderRadius?: number;
  /** Max number of languages to show (default 8) */
  maxLanguages?: number;
  layout?: LanguagesLayout;
  theme?: import("../../core/theme.ts").WidgetTheme;
}

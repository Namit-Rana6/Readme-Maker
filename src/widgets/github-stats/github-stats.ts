import type { GitHubStatsData } from "./types.ts";
import { renderStatRow } from "./stat-row.ts";
import { escapeXml } from "../../core/svg/escape.ts";
import {
  getGitHubIcon,
  type GitHubIconName,
} from "../../core/icons/github-icons.ts";
import { themes, type WidgetTheme } from "../../core/theme.ts";
// @ts-expect-error — plain JS module
import { STAT_DEFINITIONS } from "./stat-definitions.js";

// Stat keys supported by the Stats Card — must match STAT_DEFINITIONS exactly.
export type GitHubStatKey =
  | "username"
  | "name"
  | "followers"
  | "following"
  | "repositories"
  | "commits"
  | "issues"
  | "pullRequests"
  | "pullRequestReviews"
  | "repositoryContributions"
  | "contributions";

export interface GitHubStatsConfig {
  title?: string;
  hideTitle?: boolean;
  borderRadius?: number;
  showIcons?: boolean;
  hideBorder?: boolean;
  theme?: WidgetTheme;
  visibleStats?: GitHubStatKey[];
}

// Build the rich stat definition array from the shared JS module so the
// frontend widget and the API renderer cannot have different stat lists.
const statDefinitions: Array<{
  key: GitHubStatKey;
  icon: GitHubIconName;
  label: string;
  value: (data: GitHubStatsData) => string | number | undefined | null;
}> = (STAT_DEFINITIONS as [GitHubStatKey, GitHubIconName, string][]).map(
  ([key, icon, label]) => ({
    key,
    icon,
    label,
    value: (data: GitHubStatsData) => (data as Record<string, unknown>)[key] as string | number | undefined | null,
  }),
);

export class GitHubStatsWidget {
  private readonly config: GitHubStatsConfig;

  constructor(config: GitHubStatsConfig = {}) {
    this.config = config;
  }

  render(data: GitHubStatsData): string {
    const theme = this.config.theme ?? themes.default;
    const title = escapeXml(
      this.config.title ??
        (data.username ? `${data.username}'s GitHub Stats` : "GitHub Stats"),
    );

    const visibleStatKeys =
      this.config.visibleStats ?? statDefinitions.map((stat) => stat.key);

    const ICON_SIZE   = 16;
    const ICON_STROKE = 1.8;
    const ICON_X      = 20;

    const rows = statDefinitions
      .filter((stat) => visibleStatKeys.includes(stat.key))
      .map((stat) => {
        const value = stat.value(data);

        if (value === undefined || value === null || value === "" || value === 0) {
          return null;
        }

        const iconG = this.config.showIcons === false
          ? ""
          : getGitHubIcon(stat.icon, {
              size: ICON_SIZE,
              color: theme.accent,
              strokeWidth: ICON_STROKE,
            });

        return { iconG, icon: iconG, label: stat.label, value, iconX: ICON_X };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const cardHeight = this.config.hideTitle
      ? 40 + rows.length * 20
      : 80 + rows.length * 20;
    const firstRowY = this.config.hideTitle ? 30 : 60;

    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="500"
        height="${cardHeight}"
        viewBox="0 0 500 ${cardHeight}"
      >
        <rect
          width="500"
          height="${cardHeight}"
          rx="${this.config.borderRadius ?? 6}"
          fill="${theme.background}"
          ${this.config.hideBorder ? "" : `stroke="${theme.border}" stroke-width="1.5"`}
        />

        ${
          this.config.hideTitle
            ? ""
            : `<text x="20" y="30" fill="${theme.title}" font-size="16" font-weight="700">${title}</text>`
        }

        ${rows
          .map((row, index) =>
            renderStatRow({
              icon: row.icon,
              label: row.label,
              value: row.value,
              theme,
              y: firstRowY + index * 20,
            }),
          )
          .join("")}
      </svg>
    `.trim();
  }
}

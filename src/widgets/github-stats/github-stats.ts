import type { GitHubStatsData } from "./types.ts";
import { renderStatRow } from "./stat-row.ts";
import { escapeXml } from "../../core/svg/escape.ts";
import {
  getGitHubIcon,
  type GitHubIconName,
} from "../../core/icons/github-icons.ts";
import { themes, type WidgetTheme } from "../../core/theme.ts";

export type GitHubStatKey =
  | "username"
  | "name"
  | "bio"
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
const statDefinitions: Array<{
  key: GitHubStatKey;
  icon: GitHubIconName;
  label: string;
  value: (data: GitHubStatsData) => string | number | undefined | null;
}> = [
  {
    key: "username",
    icon: "user",
    label: "Username:",
    value: (data) => data.username,
  },
  {
    key: "name",
    icon: "user",
    label: "Name:",
    value: (data) => data.name,
  },
  {
    key: "followers",
    icon: "users",
    label: "Followers:",
    value: (data) => data.followers,
  },
  {
    key: "following",
    icon: "user-plus",
    label: "Following:",
    value: (data) => data.following,
  },
  {
    key: "repositories",
    icon: "book-2",
    label: "Public Repositories:",
    value: (data) => data.repositories,
  },
  {
    key: "commits",
    icon: "git-commit",
    label: "Commits:",
    value: (data) => data.commits,
  },
  {
    key: "issues",
    icon: "bug",
    label: "Total Issues:",
    value: (data) => data.issues,
  },
  {
    key: "pullRequests",
    icon: "git-pull-request",
    label: "Total Pull Requests:",
    value: (data) => data.pullRequests,
  },
  {
    key: "pullRequestReviews",
    icon: "message-check",
    label: "Total PR Reviews:",
    value: (data) => data.pullRequestReviews,
  },
  {
    key: "repositoryContributions",
    icon: "git-merge",
    label: "Repository Contributions:",
    value: (data) => data.repositoryContributions,
  },
  {
    key: "contributions",
    icon: "chart-dots",
    label: "Total Contributions:",
    value: (data) => data.contributions,
  },
];

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

    const visibleStatKeys = this.config.visibleStats ?? statDefinitions.map((stat) => stat.key);

    const rows = statDefinitions
      .filter((stat) => visibleStatKeys.includes(stat.key))
      .map((stat) => {
        const value = stat.value(data);

        if (
          value === undefined ||
          value === null ||
          value === "" ||
          value === 0
        ) {
          return null;
        }

        return {
          icon:
            this.config.showIcons === false
              ? ""
              : getGitHubIcon(stat.icon, {
                  size: 16,
                  color: theme.accent,
                  strokeWidth: 1.8,
                }),
          label: stat.label,
          value,
        };
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
            : `<text
                x="20"
                y="30"
                fill="${theme.title}"
                font-size="16"
                font-weight="700"
              >
                ${title}
              </text>`
        }

        ${rows
          .map((row, index) =>
            renderStatRow({
              ...row,
              theme,
              y: firstRowY + index * 20,
            }),
          )
          .join("")}
      </svg>
    `.trim();
  }
}
import { escapeXml } from "../core/svg/escape";
import { themes, type WidgetTheme } from "../core/theme";
import { getGitHubIcon, type GitHubIconName } from "../core/icons/github-icons";
import type { GitHubStatsData } from "./github-stats/types";

export interface EmbedWidgetOptions {
  theme?: WidgetTheme;
  borderRadius?: number;
  hideBorder?: boolean;
  hideTitle?: boolean;
  showIcons?: boolean;
  centreTitle?: boolean;
  title?: string;
  visibleStats?: string[];
}

function frame(
  width: number,
  height: number,
  options: EmbedWidgetOptions,
): { theme: WidgetTheme; opening: string; closing: string } {
  const theme = options.theme ?? themes.default;
  const border = options.hideBorder
    ? ""
    : `stroke="${theme.border}" stroke-width="1.5"`;

  return {
    theme,
    opening: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" rx="${options.borderRadius ?? 8}" fill="${theme.background}" ${border}/>`,
    closing: "</svg>",
  };
}

export class GitHubLanguagesWidget {
  constructor(private readonly options: EmbedWidgetOptions = {}) {}

  render(data: GitHubStatsData): string {
    const { theme, opening, closing } = frame(420, 150, this.options);
    const username = escapeXml(data.username ?? "GitHub user");
    const languages = [
      { name: "TypeScript", percentage: 48, color: theme.accent },
      { name: "JavaScript", percentage: 32, color: theme.title },
      { name: "Other", percentage: 20, color: theme.text },
    ];
    let offset = 20;

    const bars = languages.map((language) => {
      const width = language.percentage * 3.8;
      const bar = `<rect x="${offset}" y="58" width="${width}" height="12" fill="${language.color}"/>`;
      offset += width;
      return bar;
    });

    return `${opening}<text x="20" y="32" fill="${theme.title}" font-size="16" font-weight="700">${username}'s Languages</text><rect x="20" y="58" width="380" height="12" fill="${theme.border}"/>${bars.join("")}<text x="20" y="102" fill="${theme.text}" font-size="12">TypeScript 48%</text><text x="160" y="102" fill="${theme.text}" font-size="12">JavaScript 32%</text><text x="300" y="102" fill="${theme.text}" font-size="12">Other 20%</text>${closing}`;
  }
}

export class GitHubMiniBadgeWidget {
  constructor(private readonly options: EmbedWidgetOptions = {}) {}

  render(data: GitHubStatsData): string {
    const { theme, opening, closing } = frame(300, 72, this.options);
    const username = escapeXml(data.username ?? "GitHub user");
    const followers = data.followers ?? 0;

    return `${opening}<text x="20" y="29" fill="${theme.title}" font-size="14" font-weight="700">${username}</text><text x="20" y="51" fill="${theme.text}" font-size="12">${followers} followers</text><circle cx="266" cy="36" r="18" fill="${theme.accent}" opacity="0.2"/><text x="266" y="41" text-anchor="middle" fill="${theme.accent}" font-size="16" font-weight="700">GH</text>${closing}`;
  }
}

export class GitHubSparklineWidget {
  constructor(private readonly options: EmbedWidgetOptions = {}) {}

  render(data: GitHubStatsData): string {
    const { theme, opening, closing } = frame(420, 130, this.options);
    const username = escapeXml(data.username ?? "GitHub user");
    const points = "20,95 75,78 130,86 185,48 240,66 295,34 350,52 400,24";

    return `${opening}<text x="20" y="30" fill="${theme.title}" font-size="16" font-weight="700">${username}'s Activity</text><polyline points="${points}" fill="none" stroke="${theme.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="20" y="116" fill="${theme.text}" font-size="12">${data.contributions ?? 0} contributions this year</text>${closing}`;
  }
}

/**
 * Hidden layout — dynamic grid card.
 *
 * Columns are always 3. Rows scale with the number of selected stats:
 *   1–3 stats  → 3×1  (one row)
 *   4–6 stats  → 3×2  (two rows)   ← default
 *   7–9 stats  → 3×3  (three rows)
 *
 * Any extra slots beyond the count are left empty so the grid is always
 * full-width with no orphan cells breaking the layout.
 *
 * Each cell: icon centred at top → big bold value → muted label.
 */

// All stats that can appear in the grid, in preferred display order.
// Each entry: [statKey, iconName, displayLabel]
const GRID_STAT_DEFINITIONS: Array<[keyof GitHubStatsData, GitHubIconName, string]> = [
  ["followers",               "users",            "Followers"],
  ["commits",                 "git-commit",       "Commits"],
  ["pullRequests",            "git-pull-request", "Pull Requests"],
  ["issues",                  "bug",              "Issues"],
  ["contributions",           "chart-dots",       "Contributions"],
  ["repositories",            "book-2",           "Repositories"],
  ["following",               "user-plus",        "Following"],
  ["pullRequestReviews",      "message-check",    "PR Reviews"],
  ["repositoryContributions", "git-merge",        "Repo Contributions"],
];

export class GitHubGridWidget {
  constructor(private readonly options: EmbedWidgetOptions = {}) {}

  render(data: GitHubStatsData): string {
    const theme     = this.options.theme ?? themes.default;
    const rx        = this.options.borderRadius ?? 8;
    const showIcons = this.options.showIcons !== false; // default on
    const hideTitle   = this.options.hideTitle === true;
    const centreTitle = this.options.centreTitle === true;
    const border    = this.options.hideBorder
      ? ""
      : `stroke="${theme.border}" stroke-width="1.5"`;

    const titleText = escapeXml(
      this.options.title?.trim() ||
      (data.username ? `${data.username}'s GitHub Stats` : "GitHub Stats"),
    );

    // Build the active cell list from visibleStats (or all 6 defaults)
    const selectedKeys = this.options.visibleStats?.length
      ? this.options.visibleStats
      : GRID_STAT_DEFINITIONS.slice(0, 6).map(([k]) => k);

    // Filter definitions to only the selected keys, preserving preferred order
    const activeDefs = GRID_STAT_DEFINITIONS.filter(([key]) =>
      selectedKeys.includes(key as string),
    );

    // Clamp to 3 / 6 / 9 — snap up to next multiple of 3
    const rawCount   = Math.min(activeDefs.length, 9);
    const slotCount  = rawCount <= 3 ? 3 : rawCount <= 6 ? 6 : 9;
    const rowCount   = slotCount / 3;

    // Build cells — pad with nulls if needed so the grid is always full
    const cells: Array<{ icon: GitHubIconName; label: string; value: string | number } | null> =
      Array.from({ length: slotCount }, (_, i) => {
        const def = activeDefs[i];
        if (!def) return null;
        const [key, icon, label] = def;
        const raw = (data as Record<string, unknown>)[key as string];
        const value = (raw === undefined || raw === null) ? 0 : raw as string | number;
        return { icon, label, value };
      });

    // Layout constants
    const COLS      = 3;
    const W         = 500;
    const TITLE_H   = hideTitle ? 0 : 44;
    const CELL_W    = W / COLS;
    const CELL_H    = 110;
    const H         = TITLE_H + rowCount * CELL_H;
    const ICON_SZ       = 20;
    const ICON_Y_OFFSET = showIcons ? 18 : 28;  // shift value up when no icon
    const VAL_Y_OFFSET  = showIcons ? 62 : 52;
    const LBL_Y_OFFSET  = showIcons ? 80 : 70;

    const cellMarkup = cells.map((cell, i) => {
      const col  = i % COLS;
      const row  = Math.floor(i / COLS);
      const cx   = col * CELL_W + CELL_W / 2;
      const topY = TITLE_H + row * CELL_H;

      // Vertical dividers (between columns)
      const rightDivider = col < COLS - 1
        ? `<line x1="${(col + 1) * CELL_W}" y1="${topY + 12}" x2="${(col + 1) * CELL_W}" y2="${topY + CELL_H - 12}" stroke="${theme.border}" stroke-width="1" opacity="0.55"/>`
        : "";

      // Horizontal dividers (between rows)
      const bottomDivider = row < rowCount - 1
        ? `<line x1="${col * CELL_W + 16}" y1="${TITLE_H + (row + 1) * CELL_H}" x2="${(col + 1) * CELL_W - 16}" y2="${TITLE_H + (row + 1) * CELL_H}" stroke="${theme.border}" stroke-width="1" opacity="0.55"/>`
        : "";

      // Empty slot — just draw dividers, no content
      if (!cell) return rightDivider + bottomDivider;

      const iconMarkup = showIcons
        ? (() => {
            const iconG  = getGitHubIcon(cell.icon, { size: ICON_SZ, color: theme.accent, strokeWidth: 1.6 });
            const iconTx = cx - ICON_SZ / 2;
            const iconTy = topY + ICON_Y_OFFSET;
            return `<g transform="translate(${iconTx} ${iconTy})">${iconG}</g>`;
          })()
        : "";

      const valueStr = typeof cell.value === "number"
        ? cell.value.toLocaleString()
        : escapeXml(String(cell.value));

      return (
        rightDivider +
        bottomDivider +
        iconMarkup +
        `<text x="${cx}" y="${topY + VAL_Y_OFFSET}" text-anchor="middle" font-size="22" font-weight="700" fill="${theme.value}" font-family="Segoe UI,sans-serif">${valueStr}</text>` +
        `<text x="${cx}" y="${topY + LBL_Y_OFFSET}" text-anchor="middle" font-size="12" fill="${theme.text}" font-family="Segoe UI,sans-serif">${escapeXml(cell.label)}</text>`
      );
    }).join("");

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
      `<rect width="${W}" height="${H}" rx="${rx}" fill="${theme.background}" ${border}/>` +
      (hideTitle ? "" : `<text x="${centreTitle ? "250" : "20"}" y="28" font-size="15" font-weight="700" fill="${theme.title}" font-family="Segoe UI,sans-serif"${centreTitle ? ` text-anchor="middle"` : ""}>${titleText}</text>`) +
      (hideTitle ? "" : `<line x1="16" y1="${TITLE_H}" x2="${W - 16}" y2="${TITLE_H}" stroke="${theme.border}" stroke-width="1" opacity="0.65"/>`) +
      cellMarkup +
      `</svg>`
    );
  }
}

import { getGitHubIcon } from "../src/core/icons/github-icons.js";
import { STAT_DEFINITIONS } from "../src/widgets/github-stats/stat-definitions.js";

// Grid stat definitions — preferred display order for the hidden/grid layout.
// Keys must exist in the stats object returned by fetchGitHubStatsRuntime.
const GRID_STAT_DEFINITIONS = [
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

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Render the hidden/grid layout SVG — 3×N card matching GitHubGridWidget.
 */
export function renderGridSvg(stats, options = {}) {
  const theme       = options.theme;
  const rx          = options.borderRadius ?? 8;
  const showIcons   = options.showIcons !== false; // default on
  const hideTitle   = options.hideTitle === true;
  const hideBorder  = options.hideBorder === true;
  const centreTitle = options.centreTitle === true;
  const border      = hideBorder ? "" : `stroke="${theme.border}" stroke-width="1.5"`;

  const titleText = escapeXml(
    options.title?.trim() || `${stats.username ?? "GitHub"}'s GitHub Stats`,
  );

  // Build active cell list from visibleStats or default first 6
  const selectedKeys = options.visibleStats?.length
    ? options.visibleStats
    : GRID_STAT_DEFINITIONS.slice(0, 6).map(([k]) => k);

  const activeDefs = GRID_STAT_DEFINITIONS.filter(([key]) =>
    selectedKeys.includes(key),
  );

  const rawCount  = Math.min(activeDefs.length, 9);
  const slotCount = rawCount <= 3 ? 3 : rawCount <= 6 ? 6 : 9;
  const rowCount  = slotCount / 3;

  const cells = Array.from({ length: slotCount }, (_, i) => {
    const def = activeDefs[i];
    if (!def) return null;
    const [key, icon, label] = def;
    const raw = stats[key];
    return { icon, label, value: (raw === undefined || raw === null) ? 0 : raw };
  });

  const COLS    = 3;
  const W       = 500;
  const TITLE_H = hideTitle ? 0 : 44;
  const CELL_W  = W / COLS;
  const CELL_H  = 110;
  const H       = TITLE_H + rowCount * CELL_H;
  const ICON_SZ       = 20;
  const ICON_Y_OFFSET = showIcons ? 18 : 28;
  const VAL_Y_OFFSET  = showIcons ? 62 : 52;
  const LBL_Y_OFFSET  = showIcons ? 80 : 70;

  const cellMarkup = cells.map((cell, i) => {
    const col  = i % COLS;
    const row  = Math.floor(i / COLS);
    const cx   = col * CELL_W + CELL_W / 2;
    const topY = TITLE_H + row * CELL_H;

    const rightDivider = col < COLS - 1
      ? `<line x1="${(col + 1) * CELL_W}" y1="${topY + 12}" x2="${(col + 1) * CELL_W}" y2="${topY + CELL_H - 12}" stroke="${theme.border}" stroke-width="1" opacity="0.55"/>`
      : "";
    const bottomDivider = row < rowCount - 1
      ? `<line x1="${col * CELL_W + 16}" y1="${TITLE_H + (row + 1) * CELL_H}" x2="${(col + 1) * CELL_W - 16}" y2="${TITLE_H + (row + 1) * CELL_H}" stroke="${theme.border}" stroke-width="1" opacity="0.55"/>`
      : "";

    if (!cell) return rightDivider + bottomDivider;

    const iconMarkup = showIcons ? (() => {
      const iconG  = getGitHubIcon(cell.icon, { size: ICON_SZ, color: theme.accent, strokeWidth: 1.6 });
      const iconTx = cx - ICON_SZ / 2;
      const iconTy = topY + ICON_Y_OFFSET;
      return `<g transform="translate(${iconTx} ${iconTy})">${iconG}</g>`;
    })() : "";

    const valueStr = typeof cell.value === "number"
      ? cell.value.toLocaleString()
      : escapeXml(String(cell.value));

    return (
      rightDivider + bottomDivider + iconMarkup +
      `<text x="${cx}" y="${topY + VAL_Y_OFFSET}" text-anchor="middle" font-size="22" font-weight="700" fill="${theme.value}" font-family="Segoe UI,sans-serif">${valueStr}</text>` +
      `<text x="${cx}" y="${topY + LBL_Y_OFFSET}" text-anchor="middle" font-size="12" fill="${theme.text}" font-family="Segoe UI,sans-serif">${escapeXml(cell.label)}</text>`
    );
  }).join("");

  const titleX = centreTitle ? "250" : "20";
  const titleAnchor = centreTitle ? ` text-anchor="middle"` : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" rx="${rx}" fill="${theme.background}" ${border}/>` +
    (hideTitle ? "" : `<text x="${titleX}" y="28" font-size="15" font-weight="700" fill="${theme.title}" font-family="Segoe UI,sans-serif"${titleAnchor}>${titleText}</text>`) +
    (hideTitle ? "" : `<line x1="16" y1="${TITLE_H}" x2="${W - 16}" y2="${TITLE_H}" stroke="${theme.border}" stroke-width="1" opacity="0.65"/>`) +
    cellMarkup +
    `</svg>`
  );
}

export function renderStatsSvg(stats, options = {}) {
  const theme      = options.theme;
  const showIcons  = options.showIcons !== false; // default ON — matches renderGridSvg and builder default
  const hideTitle  = options.hideTitle  === true;
  const hideBorder = options.hideBorder === true;
  const centreTitle = options.centreTitle === true;

  const selected = options.visibleStats?.length
    ? options.visibleStats
    : STAT_DEFINITIONS.map(([key]) => key);

  const rows = STAT_DEFINITIONS
    .filter(([key]) => selected.includes(key))
    .map(([key, iconName, label]) => ({ key, iconName, label, value: stats[key] }))
    .filter(({ value }) =>
      value !== undefined && value !== null && value !== "" && value !== 0,
    );

  const rowStart = hideTitle ? 30 : 60;
  const height   = (hideTitle ? 40 : 80) + rows.length * 20;
  const border   = hideBorder ? "" : `stroke="${theme.border}" stroke-width="1.5"`;
  const titleText = escapeXml(
    options.title?.trim() || `${stats.username ?? "GitHub"}'s GitHub Stats`,
  );

  const ICON_SIZE   = 16;
  const ICON_STROKE = 1.8;
  const ICON_X      = 20;
  const TEXT_X_ICON = 44;
  const TEXT_X_BARE = 24;

  const rowMarkup = rows
    .map(({ iconName, label, value }, index) => {
      const y = rowStart + index * 20;

      if (showIcons) {
        const iconG = getGitHubIcon(iconName, {
          size: ICON_SIZE,
          color: theme.accent,
          strokeWidth: ICON_STROKE,
        });
        const ty = y - ICON_SIZE / 2;
        return (
          `<g transform="translate(${ICON_X} ${ty})">${iconG}</g>` +
          `<text x="${TEXT_X_ICON}" y="${y}" dominant-baseline="middle" font-size="12" fill="${theme.text}">${escapeXml(label)}</text>` +
          `<text x="480" y="${y}" dominant-baseline="middle" text-anchor="end" font-size="12" font-weight="600" fill="${theme.value}">${escapeXml(value)}</text>`
        );
      }

      return (
        `<text x="${TEXT_X_BARE}" y="${y}" dominant-baseline="middle" font-size="12" fill="${theme.text}">${escapeXml(label)}</text>` +
        `<text x="480" y="${y}" dominant-baseline="middle" text-anchor="end" font-size="12" font-weight="600" fill="${theme.value}">${escapeXml(value)}</text>`
      );
    })
    .join("");

  const titleX      = centreTitle ? "250" : "20";
  const titleAnchor = centreTitle ? ` text-anchor="middle"` : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${height}" viewBox="0 0 500 ${height}">` +
    `<rect width="500" height="${height}" rx="${options.borderRadius ?? 6}" fill="${theme.background}" ${border}/>` +
    (hideTitle ? "" : `<text x="${titleX}" y="30" fill="${theme.title}" font-size="16" font-weight="700"${titleAnchor}>${titleText}</text>`) +
    rowMarkup +
    `</svg>`
  );
}



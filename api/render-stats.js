import { getGitHubIcon } from "../src/core/icons/github-icons.js";
import { STAT_DEFINITIONS } from "../src/widgets/github-stats/stat-definitions.js";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Render a GitHub Stats Card as a flat SVG string.
 *
 * Icons are inlined as <g> elements (no nested <svg>) so GitHub's Markdown
 * renderer displays them correctly.
 *
 * @param {Record<string,any>} stats
 * @param {{
 *   theme: { background:string, border:string, title:string,
 *             text:string, value:string, accent:string },
 *   title?: string,
 *   hideTitle?: boolean,
 *   hideBorder?: boolean,
 *   showIcons?: boolean,
 *   borderRadius?: number,
 *   visibleStats?: string[],
 * }} options
 * @returns {string}
 */
export function renderStatsSvg(stats, options = {}) {
  const theme      = options.theme;
  const showIcons  = options.showIcons  === true;
  const hideTitle  = options.hideTitle  === true;
  const hideBorder = options.hideBorder === true;

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

  // Icon rendering:
  //   - Icons are drawn on a 24×24 grid.
  //   - We want a 16×16 icon visually, so scale = 16/24 ≈ 0.667.
  //   - The row text sits at y = rowY with dominant-baseline="middle".
  //   - We want the icon centre at (20 + 8, rowY) = (28, rowY).
  //   - After scaling, the icon occupies [0,16]×[0,16].
  //   - Translate so the icon centre lands at (28, rowY):
  //       tx = 28 - 16/2 = 20
  //       ty = rowY - 16/2 = rowY - 8
  const ICON_SIZE   = 16;
  const ICON_STROKE = 1.8;
  const ICON_X      = 20; // left edge of icon after translate
  const TEXT_X_ICON = 44; // label x when icons are shown
  const TEXT_X_BARE = 24; // label x when no icons

  const rowMarkup = rows
    .map(({ iconName, label, value }, index) => {
      const y = rowStart + index * 20;

      if (showIcons) {
        const iconG = getGitHubIcon(iconName, {
          size: ICON_SIZE,
          color: theme.accent,
          strokeWidth: ICON_STROKE,
        });
        // Translate the <g> so the 16×16 icon is centred on the row
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

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${height}" viewBox="0 0 500 ${height}">` +
    `<rect width="500" height="${height}" rx="${options.borderRadius ?? 6}" fill="${theme.background}" ${border}/>` +
    (hideTitle ? "" : `<text x="20" y="30" fill="${theme.title}" font-size="16" font-weight="700">${titleText}</text>`) +
    rowMarkup +
    `</svg>`
  );
}

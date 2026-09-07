import { detectPlatform } from "./platforms.ts";

// Badge layout constants
const BADGE_HEIGHT    = 36;
const ICON_SIZE       = 16;
const ICON_SCALE      = ICON_SIZE / 24;   // icon paths are on 24×24 grid
const ICON_PADDING_L  = 10;               // left padding inside badge
const TEXT_ICON_GAP   = 6;               // gap between icon and label
const LABEL_PADDING_R = 12;              // right padding after label
const BADGE_GAP       = 8;              // gap between badges
const CARD_PAD_X      = 18;
const CARD_PAD_Y      = 16;
const BADGE_RADIUS    = 7;
const CARD_RADIUS     = 10;
const FONT_SIZE       = 12;
const FONT_WEIGHT     = 700;
// Approximate character width at 12px bold — used for layout estimation
const CHAR_WIDTH      = 7.2;

function estimateTextWidth(text: string): number {
  return text.length * CHAR_WIDTH;
}

function escapeSvg(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Renders a single social badge as SVG elements.
 * Returns the badge markup and its pixel width.
 */
function renderBadge(
  entry: SocialLinkEntry,
  x: number,
  y: number,
): { markup: string; width: number } {
  const { platform, url } = entry;
  const labelWidth  = estimateTextWidth(platform.label);
  const badgeWidth  =
    ICON_PADDING_L + ICON_SIZE + TEXT_ICON_GAP + labelWidth + LABEL_PADDING_R;

  const iconY  = y + (BADGE_HEIGHT - ICON_SIZE) / 2;
  const textY  = y + BADGE_HEIGHT / 2;
  const textX  = x + ICON_PADDING_L + ICON_SIZE + TEXT_ICON_GAP;
  const iconTx = x + ICON_PADDING_L;

  const markup =
    // clickable link wrapper
    `<a href="${escapeSvg(url)}" target="_blank" rel="noopener noreferrer">` +
    // badge background
    `<rect x="${x}" y="${y}" width="${badgeWidth}" height="${BADGE_HEIGHT}" rx="${BADGE_RADIUS}" fill="${platform.color}"/>` +
    // icon — translate to position, scale from 24→16
    `<g transform="translate(${iconTx} ${iconY}) scale(${ICON_SCALE})" fill="${platform.textColor}">` +
    platform.iconPath +
    `</g>` +
    // label text
    `<text x="${textX}" y="${textY}" ` +
    `dominant-baseline="middle" ` +
    `font-family="Inter,Segoe UI,sans-serif" ` +
    `font-size="${FONT_SIZE}" font-weight="${FONT_WEIGHT}" ` +
    `fill="${platform.textColor}" letter-spacing=".02em">` +
    escapeSvg(platform.label) +
    `</text>` +
    `</a>`;

  return { markup, width: badgeWidth };
}

/**
 * Renders the full social links card as an SVG string.
 * Badges flow left-to-right. If they exceed maxWidth they wrap to a new row.
 */
export function renderSocialLinksCard(
  urls: string[],
  options: {
    background?: string;
    badgeGap?: number;
    cardRadius?: number;
    maxWidth?: number;
  } = {},
): string {
  const bg         = options.background ?? "#0d1117";
  const gap        = options.badgeGap   ?? BADGE_GAP;
  const cardRx     = options.cardRadius ?? CARD_RADIUS;
  const maxW       = options.maxWidth   ?? 900;

  // Build entries
  const entries: SocialLinkEntry[] = urls
    .map((u) => u.trim())
    .filter(Boolean)
    .map((url) => ({
      platform: detectPlatform(url),
      url,
    }));

  if (entries.length === 0) {
    const w = 400; const h = 68;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<rect width="${w}" height="${h}" rx="${cardRx}" fill="${bg}"/>` +
      `<text x="${w / 2}" y="${h / 2}" dominant-baseline="middle" text-anchor="middle" ` +
      `font-family="Inter,sans-serif" font-size="13" fill="#6b7280">Add at least one link</text>` +
      `</svg>`
    );
  }

  // Layout: wrap badges into rows
  type Row = Array<{ entry: SocialLinkEntry; x: number }>;
  const rows: Row[] = [];
  let currentRow: Row = [];
  let curX = CARD_PAD_X;
  let maxRowWidth = 0;

  for (const entry of entries) {
    const labelW    = estimateTextWidth(entry.platform.label);
    const badgeW    = ICON_PADDING_L + ICON_SIZE + TEXT_ICON_GAP + labelW + LABEL_PADDING_R;
    const nextX     = curX + badgeW;
    const wouldEnd  = nextX + (currentRow.length > 0 ? gap : 0);

    if (currentRow.length > 0 && wouldEnd + badgeW > maxW - CARD_PAD_X) {
      rows.push(currentRow);
      maxRowWidth = Math.max(maxRowWidth, curX - gap);
      currentRow = [];
      curX = CARD_PAD_X;
    }

    currentRow.push({ entry, x: curX });
    curX += badgeW + gap;
  }
  if (currentRow.length > 0) {
    rows.push(currentRow);
    maxRowWidth = Math.max(maxRowWidth, curX - gap);
  }

  const totalRows   = rows.length;
  const cardW       = Math.min(maxW, maxRowWidth + CARD_PAD_X);
  const cardH       = CARD_PAD_Y * 2 + totalRows * BADGE_HEIGHT + (totalRows - 1) * gap;

  let allMarkup = "";
  rows.forEach((row, rowIdx) => {
    const rowY = CARD_PAD_Y + rowIdx * (BADGE_HEIGHT + gap);
    for (const { entry, x } of row) {
      const { markup } = renderBadge(entry, x, rowY);
      allMarkup += markup;
    }
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}">` +
    `<rect width="${cardW}" height="${cardH}" rx="${cardRx}" fill="${bg}"/>` +
    allMarkup +
    `</svg>`
  );
}

/**
 * Parse a URL to get a clean display hostname (for the tooltip / aria-label).
 */
export function getDisplayUrl(url: string): string {
  try {
    if (url.startsWith("mailto:")) return url.replace("mailto:", "");
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

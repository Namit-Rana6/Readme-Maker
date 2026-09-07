import { detectPlatform } from "./platforms.ts";

// ── Layout constants ──────────────────────────────────────────────────────────
const BADGE_H     = 36;
const ICON_SZ     = 16;
const ICON_SCALE  = ICON_SZ / 24;
const PAD_L       = 10;
const GAP_TI      = 6;
const PAD_R       = 12;
const BADGE_GAP   = 8;
const CARD_PAD_X  = 18;
const CARD_PAD_Y  = 16;
const BADGE_RX    = 7;
const FONT_SZ     = 12;
const CHAR_W      = 7.2;

// Title constants
const TITLE_H     = 44;   // height reserved for title row
const TITLE_Y     = 26;   // baseline y for title text
const DIV_Y       = TITLE_H; // y of the separator line

export interface SocialLinksRenderOptions {
  background?:   string;
  cardRadius?:   number;
  maxWidth?:     number;
  /** Title text — if empty/omitted, no title is shown */
  title?:        string;
  titleColor?:   string;
  centreTitle?:  boolean;
  hideBorder?:   boolean;
  borderColor?:  string;
}

interface SocialLinkEntry {
  url:      string;
  platform: ReturnType<typeof detectPlatform>;
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function badgeWidth(label: string): number {
  return PAD_L + ICON_SZ + GAP_TI + label.length * CHAR_W + PAD_R;
}

function renderBadge(entry: SocialLinkEntry, x: number, y: number): string {
  const { platform, url } = entry;
  const bw    = badgeWidth(platform.label);
  const iconY = y + (BADGE_H - ICON_SZ) / 2;
  const textX = x + PAD_L + ICON_SZ + GAP_TI;
  const textY = y + BADGE_H / 2;

  return (
    `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">` +
    `<rect x="${x}" y="${y}" width="${bw}" height="${BADGE_H}" rx="${BADGE_RX}" fill="${platform.color}"/>` +
    `<g transform="translate(${x + PAD_L} ${iconY}) scale(${ICON_SCALE})" fill="${platform.textColor}">` +
    platform.iconPath +
    `</g>` +
    `<text x="${textX}" y="${textY}" dominant-baseline="middle" ` +
    `font-family="Inter,Segoe UI,sans-serif" font-size="${FONT_SZ}" font-weight="700" ` +
    `fill="${platform.textColor}" letter-spacing=".02em">${esc(platform.label)}</text>` +
    `</a>`
  );
}

export function renderSocialLinksCard(
  urls: string[],
  options: SocialLinksRenderOptions = {},
): string {
  const bg          = options.background  ?? "#0d1117";
  const cardRx      = options.cardRadius  ?? 10;
  const maxW        = options.maxWidth    ?? 900;
  const titleText   = options.title?.trim() ?? "";
  const showTitle   = titleText.length > 0;
  const titleColor  = options.titleColor  ?? "#a371f7";
  const centreTitle = options.centreTitle ?? false;
  const hideBorder  = options.hideBorder  ?? false;
  const borderColor = options.borderColor ?? "#30363d";

  const topOffset = showTitle ? TITLE_H : CARD_PAD_Y;

  const entries: SocialLinkEntry[] = urls
    .map((u) => u.trim())
    .filter(Boolean)
    .map((url) => ({ url, platform: detectPlatform(url) }));

  if (entries.length === 0) {
    const w = 400;
    const h = topOffset + BADGE_H + CARD_PAD_Y;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<rect width="${w}" height="${h}" rx="${cardRx}" fill="${bg}"` +
      (hideBorder ? "" : ` stroke="${borderColor}" stroke-width="1.5"`) + `/>` +
      (showTitle ? titleMarkup(titleText, w, TITLE_Y, titleColor, centreTitle) : "") +
      (showTitle ? `<line x1="12" y1="${DIV_Y}" x2="${w - 12}" y2="${DIV_Y}" stroke="${borderColor}" stroke-width="1" opacity="0.6"/>` : "") +
      `<text x="${w / 2}" y="${topOffset + BADGE_H / 2}" dominant-baseline="middle" text-anchor="middle" ` +
      `font-family="Inter,sans-serif" font-size="13" fill="#6b7280">Add at least one link</text>` +
      `</svg>`
    );
  }

  // Flow badges into rows
  type Row = Array<{ entry: SocialLinkEntry; x: number }>;
  const rows: Row[] = [];
  let curRow: Row = [];
  let curX = CARD_PAD_X;
  let maxRowW = 0;

  for (const entry of entries) {
    const bw = badgeWidth(entry.platform.label);
    if (curRow.length > 0 && curX + bw > maxW - CARD_PAD_X) {
      rows.push(curRow);
      maxRowW = Math.max(maxRowW, curX - BADGE_GAP);
      curRow = [];
      curX = CARD_PAD_X;
    }
    curRow.push({ entry, x: curX });
    curX += bw + BADGE_GAP;
  }
  if (curRow.length > 0) {
    rows.push(curRow);
    maxRowW = Math.max(maxRowW, curX - BADGE_GAP);
  }

  const rowCount = rows.length;
  const cardW    = Math.min(maxW, maxRowW + CARD_PAD_X);
  const cardH    = topOffset + rowCount * BADGE_H + (rowCount - 1) * BADGE_GAP + CARD_PAD_Y;

  let inner = "";
  rows.forEach((row, ri) => {
    const rowY = topOffset + ri * (BADGE_H + BADGE_GAP);
    for (const { entry, x } of row) {
      inner += renderBadge(entry, x, rowY);
    }
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}">` +
    `<rect width="${cardW}" height="${cardH}" rx="${cardRx}" fill="${bg}"` +
    (hideBorder ? "" : ` stroke="${borderColor}" stroke-width="1.5"`) + `/>` +
    (showTitle ? titleMarkup(titleText, cardW, TITLE_Y, titleColor, centreTitle) : "") +
    (showTitle ? `<line x1="12" y1="${DIV_Y}" x2="${cardW - 12}" y2="${DIV_Y}" stroke="${borderColor}" stroke-width="1" opacity="0.6"/>` : "") +
    inner +
    `</svg>`
  );
}

function titleMarkup(text: string, cardW: number, y: number, color: string, centre: boolean): string {
  const x      = centre ? cardW / 2 : CARD_PAD_X;
  const anchor = centre ? `text-anchor="middle" ` : "";
  return (
    `<text x="${x}" y="${y}" ${anchor}` +
    `font-family="Inter,Segoe UI,sans-serif" font-size="15" font-weight="700" ` +
    `fill="${color}">${esc(text)}</text>`
  );
}

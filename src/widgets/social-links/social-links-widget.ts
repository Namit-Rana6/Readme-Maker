import { detectPlatform } from "./platforms.ts";

// ── Layout constants ──────────────────────────────────────────────────────────
const BADGE_H      = 36;
const ICON_SZ      = 16;
const ICON_SCALE   = ICON_SZ / 24;
const PAD_L        = 10;
const GAP_TI       = 6;
const PAD_R        = 12;
const BADGE_GAP    = 8;
const CARD_PAD_X   = 18;
const CARD_PAD_Y   = 16;
const BADGE_RX     = 7;
const FONT_SZ      = 12;
const CHAR_W       = 7.2;
const TITLE_H      = 44;
const TITLE_Y      = 26;
const DIV_Y        = TITLE_H;

export interface SocialLinksRenderOptions {
  background?:  string;
  cardRadius?:  number;
  maxWidth?:    number;
  title?:       string;
  titleColor?:  string;
  centreTitle?: boolean;
  hideBorder?:  boolean;
  borderColor?: string;
  /** Grid mode: force a fixed number of columns. */
  gridCols?:    number;
  /** Override badge height in pixels (default 36). */
  badgeHeight?: number;
  /** Override total card width in pixels (default 900 max). */
  cardWidth?:   number;
  /** When true, render only the icon — no label text. Badges become square. */
  iconsOnly?:   boolean;
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

function badgeWidthFlow(label: string): number {
  return PAD_L + ICON_SZ + GAP_TI + label.length * CHAR_W + PAD_R;
}

// ── Badge render helpers ──────────────────────────────────────────────────────

/** Render a badge at a known x,y with a known width (for grid mode). */
function renderBadgeFixed(
  entry: SocialLinkEntry,
  x: number, y: number, w: number, bH = BADGE_H, iconsOnly = false,
): string {
  const { platform, url } = entry;
  const iconY = y + (bH - ICON_SZ) / 2;

  // iconsOnly: square badge, icon centred
  if (iconsOnly) {
    const iconTx = x + (w - ICON_SZ) / 2;
    return (
      `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">` +
      `<rect x="${x}" y="${y}" width="${w}" height="${bH}" rx="${BADGE_RX}" fill="${platform.color}"/>` +
      `<g transform="translate(${iconTx} ${iconY}) scale(${ICON_SCALE})" fill="${platform.textColor}">` +
      platform.iconPath + `</g>` +
      `</a>`
    );
  }

  const contentW = ICON_SZ + GAP_TI + platform.label.length * CHAR_W;
  const startX   = x + (w - contentW) / 2;
  const textX    = startX + ICON_SZ + GAP_TI;
  const textY    = y + bH / 2;

  return (
    `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">` +
    `<rect x="${x}" y="${y}" width="${w}" height="${bH}" rx="${BADGE_RX}" fill="${platform.color}"/>` +
    `<g transform="translate(${startX} ${iconY}) scale(${ICON_SCALE})" fill="${platform.textColor}">` +
    platform.iconPath + `</g>` +
    `<text x="${textX}" y="${textY}" dominant-baseline="middle" ` +
    `font-family="Inter,Segoe UI,sans-serif" font-size="${FONT_SZ}" font-weight="700" ` +
    `fill="${platform.textColor}" letter-spacing=".02em">${esc(platform.label)}</text>` +
    `</a>`
  );
}

/** Render a badge at known x,y with auto width (for flow mode). */
function renderBadgeAuto(entry: SocialLinkEntry, x: number, y: number, bH = BADGE_H, iconsOnly = false): string {
  // In icons-only mode use a square badge (bH × bH)
  const w = iconsOnly ? bH : badgeWidthFlow(entry.platform.label);
  return renderBadgeFixed(entry, x, y, w, bH, iconsOnly);
}

// ── Empty state ───────────────────────────────────────────────────────────────

function emptyCard(
  cardRx: number, bg: string, hideBorder: boolean, borderColor: string,
  showTitle: boolean, titleText: string, titleColor: string, centreTitle: boolean,
  topOffset: number,
): string {
  const w = 400;
  const h = topOffset + BADGE_H + CARD_PAD_Y;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" rx="${cardRx}" fill="${bg}"` +
    (hideBorder ? "" : ` stroke="${borderColor}" stroke-width="1.5"`) + `/>` +
    (showTitle ? titleMarkup(titleText, w, TITLE_Y, titleColor, centreTitle) : "") +
    (showTitle ? dividerMarkup(w, borderColor) : "") +
    `<text x="${w / 2}" y="${topOffset + BADGE_H / 2}" dominant-baseline="middle" text-anchor="middle" ` +
    `font-family="Inter,sans-serif" font-size="13" fill="#6b7280">Add at least one link</text>` +
    `</svg>`
  );
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export function renderSocialLinksCard(
  urls: string[],
  options: SocialLinksRenderOptions = {},
): string {
  const bg          = options.background  ?? "#0d1117";
  const cardRx      = options.cardRadius  ?? 10;
  const maxW        = options.cardWidth   ?? options.maxWidth ?? 900;
  const titleText   = options.title?.trim() ?? "";
  const showTitle   = titleText.length > 0;
  const titleColor  = options.titleColor  ?? "#a371f7";
  const centreTitle = options.centreTitle ?? false;
  const hideBorder  = options.hideBorder  ?? false;
  const borderColor = options.borderColor ?? "#30363d";
  const gridCols    = (options.gridCols ?? 0) >= 1 ? Math.floor(options.gridCols!) : 0;
  const bH          = Math.max(32, Math.min(56, options.badgeHeight ?? BADGE_H));
  const iconsOnly   = options.iconsOnly ?? false;

  const topOffset = showTitle ? TITLE_H : CARD_PAD_Y;

  const entries: SocialLinkEntry[] = urls
    .map((u) => u.trim())
    .filter(Boolean)
    .map((url) => ({ url, platform: detectPlatform(url) }));

  if (entries.length === 0) {
    return emptyCard(cardRx, bg, hideBorder, borderColor, showTitle, titleText, titleColor, centreTitle, topOffset);
  }

  // ── Grid mode ──────────────────────────────────────────────────────────────
  if (gridCols >= 1) {
    const cols     = Math.min(gridCols, entries.length);
    const rows     = Math.ceil(entries.length / cols);
    const innerW   = maxW - CARD_PAD_X * 2;
    const cellW    = (innerW - (cols - 1) * BADGE_GAP) / cols;
    const cardW    = maxW;
    const cardH    = topOffset + rows * bH + (rows - 1) * BADGE_GAP + CARD_PAD_Y;

    let inner = "";
    entries.forEach((entry, i) => {
      const col  = i % cols;
      const row  = Math.floor(i / cols);
      const x    = CARD_PAD_X + col * (cellW + BADGE_GAP);
      const y    = topOffset + row * (bH + BADGE_GAP);
      inner += renderBadgeFixed(entry, x, y, cellW, bH, iconsOnly);
    });

    return svgWrap(cardW, cardH, cardRx, bg, hideBorder, borderColor,
      showTitle, titleText, titleColor, centreTitle, inner);
  }

  // ── Flow mode (default) ────────────────────────────────────────────────────
  type Row = Array<{ entry: SocialLinkEntry; x: number }>;
  const rows: Row[] = [];
  let curRow: Row = [];
  let curX = CARD_PAD_X;
  let maxRowW = 0;

  for (const entry of entries) {
    // icons-only badges are square (bH × bH), not text-width
    const bw = iconsOnly ? bH : badgeWidthFlow(entry.platform.label);
    if (curRow.length > 0 && curX + bw > maxW - CARD_PAD_X) {
      rows.push(curRow);
      maxRowW = Math.max(maxRowW, curX - BADGE_GAP);
      curRow  = [];
      curX    = CARD_PAD_X;
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
  const cardH    = topOffset + rowCount * bH + (rowCount - 1) * BADGE_GAP + CARD_PAD_Y;

  let inner = "";
  rows.forEach((row, ri) => {
    const rowY = topOffset + ri * (bH + BADGE_GAP);
    for (const { entry, x } of row) inner += renderBadgeAuto(entry, x, rowY, bH, iconsOnly);
  });

  return svgWrap(cardW, cardH, cardRx, bg, hideBorder, borderColor,
    showTitle, titleText, titleColor, centreTitle, inner);
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

function svgWrap(
  w: number, h: number, rx: number,
  bg: string, hideBorder: boolean, borderColor: string,
  showTitle: boolean, titleText: string, titleColor: string, centreTitle: boolean,
  inner: string,
): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" rx="${rx}" fill="${bg}"` +
    (hideBorder ? "" : ` stroke="${borderColor}" stroke-width="1.5"`) + `/>` +
    (showTitle ? titleMarkup(titleText, w, TITLE_Y, titleColor, centreTitle) : "") +
    (showTitle ? dividerMarkup(w, borderColor) : "") +
    inner +
    `</svg>`
  );
}

function titleMarkup(
  text: string, cardW: number, y: number,
  color: string, centre: boolean,
): string {
  const x      = centre ? cardW / 2 : CARD_PAD_X;
  const anchor = centre ? `text-anchor="middle" ` : "";
  return (
    `<text x="${x}" y="${y}" ${anchor}` +
    `font-family="Inter,Segoe UI,sans-serif" font-size="15" font-weight="700" ` +
    `fill="${color}">${esc(text)}</text>`
  );
}

function dividerMarkup(cardW: number, borderColor: string): string {
  return `<line x1="12" y1="${DIV_Y}" x2="${cardW - 12}" y2="${DIV_Y}" stroke="${borderColor}" stroke-width="1" opacity="0.6"/>`;
}

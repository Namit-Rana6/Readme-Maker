/**
 * GET /api/social-card
 *
 * Query params:
 *   link   — repeatable, one per social URL  (e.g. ?link=https://github.com/x&link=https://linkedin.com/in/y)
 *   bg     — card background hex  (default #0d1117)
 *   radius — card corner radius   (default 10)
 *
 * Returns an SVG image.  No GitHub token required — purely client-side data.
 */

import { PLATFORMS } from "../src/widgets/social-links/platforms.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function detectPlatform(url) {
  if (url.startsWith("mailto:")) {
    return PLATFORMS.find((p) => p.key === "email") ?? PLATFORMS[PLATFORMS.length - 1];
  }
  for (const p of PLATFORMS) {
    if (p.match.test(url)) return p;
  }
  return {
    key: "link", label: "Link",
    color: "#4b5563", textColor: "#ffffff",
    iconPath: `<path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>`,
  };
}

// Badge layout constants — kept in sync with social-links-widget.ts
const BADGE_H    = 36;
const ICON_SZ    = 16;
const ICON_SCALE = ICON_SZ / 24;
const PAD_L      = 10;
const GAP_TI     = 6;   // icon → text
const PAD_R      = 12;
const BADGE_GAP  = 8;
const CARD_PAD_X = 18;
const CARD_PAD_Y = 16;
const BADGE_RX   = 7;
const FONT_SZ    = 12;
const CHAR_W     = 7.2; // approximate px per char at 12px bold

function badgeWidth(label) {
  return PAD_L + ICON_SZ + GAP_TI + label.length * CHAR_W + PAD_R;
}

/** Badge for grid mode — fixed width, content centred inside cell. Supports iconsOnly (square). */
function renderBadgeGrid(url, platform, x, y, cellW, bH = BADGE_H, iconsOnly = false) {
  const iconY = y + (bH - ICON_SZ) / 2;

  if (iconsOnly) {
    const iconTx = x + (cellW - ICON_SZ) / 2;
    return (
      `<a href="${escapeXml(url)}" target="_blank" rel="noopener noreferrer">` +
      `<rect x="${x}" y="${y}" width="${cellW}" height="${bH}" rx="${BADGE_RX}" fill="${platform.color}"/>` +
      `<g transform="translate(${iconTx} ${iconY}) scale(${ICON_SCALE})" fill="${platform.textColor}">` +
      platform.iconPath + `</g>` +
      `</a>`
    );
  }

  const contentW  = ICON_SZ + GAP_TI + platform.label.length * CHAR_W;
  const startX    = x + (cellW - contentW) / 2;
  const textX     = startX + ICON_SZ + GAP_TI;
  const textY     = y + bH / 2;
  return (
    `<a href="${escapeXml(url)}" target="_blank" rel="noopener noreferrer">` +
    `<rect x="${x}" y="${y}" width="${cellW}" height="${bH}" rx="${BADGE_RX}" fill="${platform.color}"/>` +
    `<g transform="translate(${startX} ${iconY}) scale(${ICON_SCALE})" fill="${platform.textColor}">` +
    platform.iconPath + `</g>` +
    `<text x="${textX}" y="${textY}" dominant-baseline="middle" ` +
    `font-family="Inter,Segoe UI,sans-serif" font-size="${FONT_SZ}" font-weight="700" ` +
    `fill="${platform.textColor}" letter-spacing=".02em">${escapeXml(platform.label)}</text>` +
    `</a>`
  );
}

/** Wrap SVG content with card background, border, and optional title. */
function buildSvg(cardW, cardH, rx, bg, hideBorder, borderColor, showTitle, titleText, titleColor, centreTitle, inner) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}">` +
    `<rect width="${cardW}" height="${cardH}" rx="${rx}" fill="${bg}"` +
    (hideBorder ? "" : ` stroke="${borderColor}" stroke-width="1.5"`) + `/>` +
    (showTitle ? makeTitleSvg(titleText, cardW, titleColor, centreTitle, borderColor) : "") +
    inner +
    `</svg>`
  );
}

function renderSocialCardSvg(urls, bg, cardRx, maxW, titleText = "", titleColor = "#a371f7", centreTitle = false, hideBorder = false, borderColor = "#30363d", gridCols = 0, bH = 36, iconsOnly = false) {
  const entries = urls.map((u) => ({ url: u, platform: detectPlatform(u) }));
  const showTitle = titleText.trim().length > 0;
  const TITLE_H = 44;
  const topOffset = showTitle ? TITLE_H : CARD_PAD_Y;

  if (entries.length === 0) {
    const w = 400; const h = topOffset + BADGE_H + CARD_PAD_Y;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<rect width="${w}" height="${h}" rx="${cardRx}" fill="${bg}"${hideBorder ? "" : ` stroke="${borderColor}" stroke-width="1.5"`}/>` +
      (showTitle ? makeTitleSvg(titleText, w, titleColor, centreTitle, borderColor) : "") +
      `<text x="${w/2}" y="${topOffset + BADGE_H/2}" dominant-baseline="middle" text-anchor="middle" ` +
      `font-family="Inter,sans-serif" font-size="13" fill="#6b7280">Add at least one link</text>` +
      `</svg>`
    );
  }

  // ── Grid mode ──
  if (gridCols >= 1) {
    const cols   = Math.min(gridCols, entries.length);
    const rows   = Math.ceil(entries.length / cols);
    const innerW = maxW - CARD_PAD_X * 2;
    // icons-only: square cells (bH × bH)
    const cellW  = iconsOnly ? bH : (innerW - (cols - 1) * BADGE_GAP) / cols;
    const cardW  = iconsOnly
      ? CARD_PAD_X * 2 + cols * bH + (cols - 1) * BADGE_GAP
      : maxW;
    const cardH  = topOffset + rows * bH + (rows - 1) * BADGE_GAP + CARD_PAD_Y;

    let inner = "";
    entries.forEach(({ url, platform }, i) => {
      const col  = i % cols;
      const row  = Math.floor(i / cols);
      const x    = CARD_PAD_X + col * (cellW + BADGE_GAP);
      const y    = topOffset + row * (bH + BADGE_GAP);
      inner += renderBadgeGrid(url, platform, x, y, cellW, bH, iconsOnly);
    });

    return buildSvg(cardW, cardH, cardRx, bg, hideBorder, borderColor,
      showTitle, titleText, titleColor, centreTitle, inner);
  }

  // ── Flow mode ──
  const rows = [];
  let curRow = [];
  let curX = CARD_PAD_X;
  let maxRowW = 0;

  for (const entry of entries) {
    // icons-only: square badge width = bH
    const bw = iconsOnly ? bH : badgeWidth(entry.platform.label);
    const wouldEnd = curX + bw;
    if (curRow.length > 0 && wouldEnd > maxW - CARD_PAD_X) {
      rows.push(curRow);
      maxRowW = Math.max(maxRowW, curX - BADGE_GAP);
      curRow = [];
      curX = CARD_PAD_X;
    }
    curRow.push({ entry, x: curX, bw });
    curX += bw + BADGE_GAP;
  }
  if (curRow.length > 0) {
    rows.push(curRow);
    maxRowW = Math.max(maxRowW, curX - BADGE_GAP);
  }

  const rowCount = rows.length;
  const cardW = Math.min(maxW, maxRowW + CARD_PAD_X);
  const cardH = topOffset + rowCount * bH + (rowCount - 1) * BADGE_GAP + CARD_PAD_Y;

  let inner = "";
  rows.forEach((row, ri) => {
    const rowY = topOffset + ri * (bH + BADGE_GAP);
    for (const { entry: { url, platform }, x, bw } of row) {
      const iconY = rowY + (bH - ICON_SZ) / 2;

      if (iconsOnly) {
        const iconTx = x + (bw - ICON_SZ) / 2;
        inner +=
          `<a href="${escapeXml(url)}" target="_blank" rel="noopener noreferrer">` +
          `<rect x="${x}" y="${rowY}" width="${bw}" height="${bH}" rx="${BADGE_RX}" fill="${platform.color}"/>` +
          `<g transform="translate(${iconTx} ${iconY}) scale(${ICON_SCALE})" fill="${platform.textColor}">` +
          platform.iconPath + `</g>` +
          `</a>`;
      } else {
        const textX = x + PAD_L + ICON_SZ + GAP_TI;
        const textY = rowY + bH / 2;
        inner +=
          `<a href="${escapeXml(url)}" target="_blank" rel="noopener noreferrer">` +
          `<rect x="${x}" y="${rowY}" width="${bw}" height="${bH}" rx="${BADGE_RX}" fill="${platform.color}"/>` +
          `<g transform="translate(${x + PAD_L} ${iconY}) scale(${ICON_SCALE})" fill="${platform.textColor}">` +
          platform.iconPath + `</g>` +
          `<text x="${textX}" y="${textY}" dominant-baseline="middle" ` +
          `font-family="Inter,Segoe UI,sans-serif" font-size="${FONT_SZ}" font-weight="700" ` +
          `fill="${platform.textColor}" letter-spacing=".02em">${escapeXml(platform.label)}</text>` +
          `</a>`;
      }
    }
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}" viewBox="0 0 ${cardW} ${cardH}">` +
    `<rect width="${cardW}" height="${cardH}" rx="${cardRx}" fill="${bg}"${hideBorder ? "" : ` stroke="${borderColor}" stroke-width="1.5"`}/>` +
    (showTitle ? makeTitleSvg(titleText, cardW, titleColor, centreTitle, borderColor) : "") +
    inner +
    `</svg>`
  );
}

function makeTitleSvg(text, cardW, color, centre, borderColor) {
  const x      = centre ? cardW / 2 : 18;
  const anchor = centre ? ` text-anchor="middle"` : "";
  return (
    `<text x="${x}" y="26"${anchor} ` +
    `font-family="Inter,Segoe UI,sans-serif" font-size="15" font-weight="700" ` +
    `fill="${color}">${escapeXml(text)}</text>` +
    `<line x1="12" y1="44" x2="${cardW - 12}" y2="44" stroke="${borderColor}" stroke-width="1" opacity="0.6"/>`
  );
}

// ── Vercel handler ────────────────────────────────────────────────────────────

export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const url    = new URL(req.url ?? "/", `https://${req.headers.host ?? "localhost"}`);
  const links       = url.searchParams.getAll("link").map((l) => l.trim()).filter(Boolean);
  const bg          = url.searchParams.get("bg")          ?? "#0d1117";
  const radius      = Number(url.searchParams.get("radius")      ?? 10);
  const maxW        = Number(url.searchParams.get("maxw")        ?? 900);
  const title       = url.searchParams.get("title")       ?? "";
  const titleColor  = url.searchParams.get("titleColor")  ?? "#a371f7";
  const centreTitle = url.searchParams.get("centreTitle") === "1";
  const hideBorder  = url.searchParams.get("hideBorder")  === "1";
  const borderColor = url.searchParams.get("borderColor") ?? "#30363d";
  const colsParam   = url.searchParams.get("cols");
  const gridCols    = colsParam ? Math.max(1, Number(colsParam)) : 0;
  const bhParam     = url.searchParams.get("bh");
  const badgeHeight = bhParam ? Math.max(32, Math.min(56, Number(bhParam))) : 36;
  const iconsOnly   = url.searchParams.get("iconsOnly") === "1";

  const svg = renderSocialCardSvg(links, bg, radius, maxW, title, titleColor, centreTitle, hideBorder, borderColor, gridCols, badgeHeight, iconsOnly);

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).send(svg);
}

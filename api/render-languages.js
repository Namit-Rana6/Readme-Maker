/**
 * Backend renderer for the Top Languages card — all 10 layouts.
 * Plain JS so the Vercel/Node runtime can import it without a build step.
 *
 * Layouts: bar | stacked | compact | donut | donut-vertical |
 *          horizontal-list | vertical-list | grid | treemap | pie-list
 */

const W       = 500;
const PAD_X   = 24;
const PAD_Y   = 20;
const TITLE_H = 44;
const INNER_W = W - PAD_X * 2;
const DOT_R   = 5;
const FONT    = "Segoe UI,sans-serif";

function e(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

function pct(n) { return n.toFixed(1) + "%"; }

function header(hideTitle, titleText, titleColor, centreTitle, divColor) {
  if (hideTitle) return "";
  const tx = centreTitle ? W / 2 : PAD_X;
  const anchor = centreTitle ? ` text-anchor="middle"` : "";
  return (
    `<text x="${tx}" y="28" font-size="15" font-weight="700" fill="${titleColor}" font-family="${FONT}"${anchor}>${e(titleText)}</text>` +
    `<line x1="${PAD_X - 4}" y1="${TITLE_H}" x2="${W - PAD_X + 4}" y2="${TITLE_H}" stroke="${divColor}" stroke-width="1" opacity="0.65"/>`
  );
}

// ── 1. BAR ──────────────────────────────────────────────────────────────────
function renderBarSvg(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const BAR_H = 10, BAR_Y = titleH + PAD_Y;
  const LEG_Y = BAR_Y + BAR_H + 18, ROW_H = 32, cols = 2;
  const rows = Math.ceil(langs.length / cols);
  const totalH = LEG_Y + rows * ROW_H + PAD_Y;
  const clipId = "bc";
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;

  let bx = PAD_X;
  const segs = langs.map(l => {
    const sw = (l.percentage / 100) * INNER_W;
    const s = `<rect x="${bx.toFixed(1)}" y="${BAR_Y}" width="${Math.max(sw,0).toFixed(1)}" height="${BAR_H}" fill="${e(l.color)}"/>`;
    bx += sw; return s;
  });
  if (bx < PAD_X + INNER_W)
    segs.push(`<rect x="${bx.toFixed(1)}" y="${BAR_Y}" width="${(PAD_X+INNER_W-bx).toFixed(1)}" height="${BAR_H}" fill="${t.border}"/>`);

  const legend = langs.map((l, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const lx = PAD_X + col * (INNER_W / cols);
    const ly = LEG_Y + row * ROW_H + ROW_H / 2;
    return (
      `<circle cx="${lx + DOT_R}" cy="${ly}" r="${DOT_R}" fill="${e(l.color)}"/>` +
      `<text x="${lx + DOT_R*2 + 8}" y="${ly}" dominant-baseline="middle" font-size="12" fill="${t.text}" font-family="${FONT}">${e(l.name)}</text>` +
      `<text x="${lx + INNER_W/cols - 4}" y="${ly}" dominant-baseline="middle" text-anchor="end" font-size="12" font-weight="600" fill="${t.value}" font-family="${FONT}">${pct(l.percentage)}</text>`
    );
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<defs><clipPath id="${clipId}"><rect x="${PAD_X}" y="${BAR_Y}" width="${INNER_W}" height="${BAR_H}" rx="${BAR_H/2}"/></clipPath></defs>` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    `<g clip-path="url(#${clipId})">${segs.join("")}</g>` +
    legend.join("") + `</svg>`
  );
}

// ── 2. STACKED ──────────────────────────────────────────────────────────────
function renderStackedSvg(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const BAR_H = 28, BAR_Y = titleH + PAD_Y;
  const totalH = BAR_Y + BAR_H + PAD_Y;
  const clipId = "sc";
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;

  let bx = PAD_X;
  const segs = [], labels = [];
  langs.forEach(l => {
    const sw = (l.percentage / 100) * INNER_W;
    if (sw < 2) { bx += sw; return; }
    segs.push(`<rect x="${bx.toFixed(1)}" y="${BAR_Y}" width="${sw.toFixed(1)}" height="${BAR_H}" fill="${e(l.color)}"/>`);
    if (sw > 36) {
      const cx = bx + sw / 2;
      const label = l.name.length > 6 ? l.name.slice(0,5) + "…" : l.name;
      labels.push(`<text x="${cx.toFixed(1)}" y="${BAR_Y + BAR_H/2}" dominant-baseline="middle" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="${FONT}" opacity="0.9">${e(label)}</text>`);
    }
    bx += sw;
  });
  if (bx < PAD_X + INNER_W)
    segs.push(`<rect x="${bx.toFixed(1)}" y="${BAR_Y}" width="${(PAD_X+INNER_W-bx).toFixed(1)}" height="${BAR_H}" fill="${t.border}"/>`);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<defs><clipPath id="${clipId}"><rect x="${PAD_X}" y="${BAR_Y}" width="${INNER_W}" height="${BAR_H}" rx="${BAR_H/2}"/></clipPath></defs>` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    `<g clip-path="url(#${clipId})">${segs.join("")}${labels.join("")}</g>` +
    `</svg>`
  );
}

// ── 3. COMPACT ──────────────────────────────────────────────────────────────
function renderCompactSvg(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const ROW = 22, BAR_W = 110, BAR_H = 7;
  const BAR_X = W - PAD_X - BAR_W;
  const totalH = titleH + PAD_Y + langs.length * ROW + PAD_Y;
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;

  const rows = langs.map((l, i) => {
    const y = titleH + PAD_Y + i * ROW + ROW / 2;
    const fw = Math.max((l.percentage / 100) * BAR_W, 1);
    return (
      `<circle cx="${PAD_X + DOT_R}" cy="${y}" r="${DOT_R}" fill="${e(l.color)}"/>` +
      `<text x="${PAD_X + DOT_R*2 + 8}" y="${y}" dominant-baseline="middle" font-size="12" fill="${t.text}" font-family="${FONT}">${e(l.name)}</text>` +
      `<text x="${BAR_X - 8}" y="${y}" dominant-baseline="middle" text-anchor="end" font-size="11" fill="${t.value}" font-family="${FONT}">${pct(l.percentage)}</text>` +
      `<rect x="${BAR_X}" y="${y - BAR_H/2}" width="${BAR_W}" height="${BAR_H}" rx="${BAR_H/2}" fill="${t.border}"/>` +
      `<rect x="${BAR_X}" y="${y - BAR_H/2}" width="${fw.toFixed(1)}" height="${BAR_H}" rx="${BAR_H/2}" fill="${e(l.color)}"/>`
    );
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    rows.join("") + `</svg>`
  );
}

// ── 4. DONUT ────────────────────────────────────────────────────────────────
function renderDonutSvg(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const CX = 130, R = 80, INNER_R = 52;
  const CY_OFF = 110, CY = titleH + CY_OFF;
  const mid_r = INNER_R + (R - INNER_R) / 2;
  const CIRC = 2 * Math.PI * mid_r;
  const ROW = 22;
  const legX = CX + R + 36;
  const contentH = Math.max(CY_OFF * 2, langs.length * ROW + 10);
  const totalH = titleH + contentH + PAD_Y;
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;

  let offset = -90;
  const arcs = langs.map(l => {
    const dash = (l.percentage / 100) * CIRC;
    const gap = CIRC - dash;
    const rotate = offset;
    offset += (l.percentage / 100) * 360;
    return `<circle cx="${CX}" cy="${CY}" r="${mid_r}" fill="none" stroke="${e(l.color)}" stroke-width="${R - INNER_R}" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}" transform="rotate(${rotate} ${CX} ${CY})"/>`;
  });

  const legend = langs.map((l, i) => {
    const ly = titleH + PAD_Y + i * ROW + ROW / 2;
    return (
      `<circle cx="${legX + DOT_R}" cy="${ly}" r="${DOT_R}" fill="${e(l.color)}"/>` +
      `<text x="${legX + DOT_R*2 + 7}" y="${ly}" dominant-baseline="middle" font-size="11" fill="${t.text}" font-family="${FONT}">${e(l.name)}</text>` +
      `<text x="${W - PAD_X}" y="${ly}" dominant-baseline="middle" text-anchor="end" font-size="11" font-weight="600" fill="${t.value}" font-family="${FONT}">${pct(l.percentage)}</text>`
    );
  });

  const top = langs[0];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    arcs.join("") +
    `<circle cx="${CX}" cy="${CY}" r="${INNER_R}" fill="${t.background}"/>` +
    `<text x="${CX}" y="${CY - 7}" text-anchor="middle" font-size="13" font-weight="700" fill="${t.value}" font-family="${FONT}">${e(top.name)}</text>` +
    `<text x="${CX}" y="${CY + 10}" text-anchor="middle" font-size="11" fill="${t.text}" font-family="${FONT}">${pct(top.percentage)}</text>` +
    legend.join("") + `</svg>`
  );
}

// ── 5. DONUT VERTICAL ───────────────────────────────────────────────────────
function renderDonutVerticalSvg(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const CX = W / 2, R = 90, INNER_R = 58;
  const CY = titleH + PAD_Y + R;
  const mid_r = INNER_R + (R - INNER_R) / 2;
  const CIRC = 2 * Math.PI * mid_r;
  const LEG_COLS = 2, ROW_H = 28;
  const legStartY = CY + R + 24;
  const legRows = Math.ceil(langs.length / LEG_COLS);
  const totalH = legStartY + legRows * ROW_H + PAD_Y;
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;

  let offset = -90;
  const arcs = langs.map(l => {
    const dash = (l.percentage / 100) * CIRC;
    const gap = CIRC - dash;
    const rotate = offset;
    offset += (l.percentage / 100) * 360;
    return `<circle cx="${CX}" cy="${CY}" r="${mid_r}" fill="none" stroke="${e(l.color)}" stroke-width="${R - INNER_R}" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}" transform="rotate(${rotate} ${CX} ${CY})"/>`;
  });

  const legend = langs.map((l, i) => {
    const col = i % LEG_COLS, row = Math.floor(i / LEG_COLS);
    const colW = INNER_W / LEG_COLS;
    const lx = PAD_X + col * colW;
    const ly = legStartY + row * ROW_H + ROW_H / 2;
    return (
      `<circle cx="${lx + DOT_R}" cy="${ly}" r="${DOT_R}" fill="${e(l.color)}"/>` +
      `<text x="${lx + DOT_R*2 + 7}" y="${ly}" dominant-baseline="middle" font-size="11" fill="${t.text}" font-family="${FONT}">${e(l.name)}</text>` +
      `<text x="${lx + colW - 4}" y="${ly}" dominant-baseline="middle" text-anchor="end" font-size="11" font-weight="600" fill="${t.value}" font-family="${FONT}">${pct(l.percentage)}</text>`
    );
  });

  const top = langs[0];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    arcs.join("") +
    `<circle cx="${CX}" cy="${CY}" r="${INNER_R}" fill="${t.background}"/>` +
    `<text x="${CX}" y="${CY - 8}" text-anchor="middle" font-size="14" font-weight="700" fill="${t.value}" font-family="${FONT}">${e(top.name)}</text>` +
    `<text x="${CX}" y="${CY + 11}" text-anchor="middle" font-size="12" fill="${t.text}" font-family="${FONT}">${pct(top.percentage)}</text>` +
    legend.join("") + `</svg>`
  );
}

// ── 6. HORIZONTAL LIST ──────────────────────────────────────────────────────
function renderHorizontalListSvg(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const ROW = 26, BAR_H = 10, NAME_W = 110;
  const BAR_START = PAD_X + NAME_W + 8;
  const BAR_AVAIL = W - BAR_START - 48 - PAD_X;
  const totalH = titleH + PAD_Y + langs.length * ROW + PAD_Y;
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;

  const rows = langs.map((l, i) => {
    const y = titleH + PAD_Y + i * ROW + ROW / 2;
    const fw = Math.max((l.percentage / 100) * BAR_AVAIL, 1);
    return (
      `<circle cx="${PAD_X + DOT_R}" cy="${y}" r="${DOT_R}" fill="${e(l.color)}"/>` +
      `<text x="${PAD_X + DOT_R*2 + 7}" y="${y}" dominant-baseline="middle" font-size="12" fill="${t.text}" font-family="${FONT}">${e(l.name)}</text>` +
      `<rect x="${BAR_START}" y="${y - BAR_H/2}" width="${BAR_AVAIL}" height="${BAR_H}" rx="${BAR_H/2}" fill="${t.border}"/>` +
      `<rect x="${BAR_START}" y="${y - BAR_H/2}" width="${fw.toFixed(1)}" height="${BAR_H}" rx="${BAR_H/2}" fill="${e(l.color)}"/>` +
      `<text x="${W - PAD_X}" y="${y}" dominant-baseline="middle" text-anchor="end" font-size="11" font-weight="600" fill="${t.value}" font-family="${FONT}">${pct(l.percentage)}</text>`
    );
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    rows.join("") + `</svg>`
  );
}

// ── 7. VERTICAL LIST ────────────────────────────────────────────────────────
function renderVerticalListSvg(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const ITEM_H = 44, ITEM_PAD = 8, SWATCH = 10;
  const totalH = titleH + PAD_Y + langs.length * (ITEM_H + ITEM_PAD) - ITEM_PAD + PAD_Y;
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;

  const items = langs.map((l, i) => {
    const iy = titleH + PAD_Y + i * (ITEM_H + ITEM_PAD);
    const barW = (l.percentage / 100) * INNER_W;
    return (
      `<rect x="${PAD_X}" y="${iy}" width="${INNER_W}" height="${ITEM_H}" rx="6" fill="${t.border}" opacity="0.35"/>` +
      `<rect x="${PAD_X}" y="${iy + ITEM_H - 4}" width="${Math.max(barW,4).toFixed(1)}" height="4" rx="2" fill="${e(l.color)}"/>` +
      `<circle cx="${PAD_X + 14}" cy="${iy + ITEM_H/2 - 3}" r="${SWATCH/2}" fill="${e(l.color)}"/>` +
      `<text x="${PAD_X + 14 + SWATCH/2 + 8}" y="${iy + ITEM_H/2 - 4}" font-size="13" font-weight="600" fill="${t.text}" font-family="${FONT}">${e(l.name)}</text>` +
      `<text x="${W - PAD_X - 4}" y="${iy + ITEM_H/2 - 4}" text-anchor="end" font-size="13" font-weight="700" fill="${t.value}" font-family="${FONT}">${pct(l.percentage)}</text>`
    );
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    items.join("") + `</svg>`
  );
}

// ── 8. GRID ─────────────────────────────────────────────────────────────────
function renderGridSvg2(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const COLS = 2, GAP = 8, cellW = (INNER_W - GAP) / COLS, cellH = 60;
  const rows = Math.ceil(langs.length / COLS);
  const totalH = titleH + PAD_Y + rows * (cellH + GAP) - GAP + PAD_Y;
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;

  const cells = langs.map((l, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const cx = PAD_X + col * (cellW + GAP);
    const cy = titleH + PAD_Y + row * (cellH + GAP);
    return (
      `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" rx="7" fill="${t.border}" opacity="0.4"/>` +
      `<rect x="${cx}" y="${cy}" width="4" height="${cellH}" rx="2" fill="${e(l.color)}"/>` +
      `<text x="${cx + 14}" y="${cy + 22}" font-size="12" font-weight="600" fill="${t.text}" font-family="${FONT}">${e(l.name)}</text>` +
      `<text x="${cx + 14}" y="${cy + 41}" font-size="18" font-weight="700" fill="${e(l.color)}" font-family="${FONT}">${pct(l.percentage)}</text>`
    );
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    cells.join("") + `</svg>`
  );
}

// ── 9. TREEMAP ──────────────────────────────────────────────────────────────
function renderTreemapSvg(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const MAP_H = 220, GAP = 3;
  const totalH = titleH + PAD_Y + MAP_H + PAD_Y;
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;
  const mapY = titleH + PAD_Y;

  let remaining = [...langs];
  let curY = mapY;
  const rects = [];

  while (remaining.length > 0) {
    const heightLeft = mapY + MAP_H - curY;
    const totalPct = remaining.reduce((s, l) => s + l.percentage, 0);
    let rowItems = 1, rowPct = remaining[0].percentage;
    for (let k = 1; k < remaining.length; k++) {
      const np = remaining[k].percentage;
      const minWNext = (remaining[0].percentage / (rowPct + np)) * INNER_W;
      if (minWNext >= 30) { rowItems = k + 1; rowPct += np; } else break;
    }
    const row = remaining.splice(0, rowItems);
    const rowH = Math.max((rowPct / totalPct) * heightLeft - GAP, 8);
    const rowTotalPct = row.reduce((s, l) => s + l.percentage, 0);
    let curX = PAD_X;
    row.forEach((l, ri) => {
      const w = Math.max((l.percentage / rowTotalPct) * INNER_W - (ri < row.length-1 ? GAP : 0), 8);
      const showLabel = w > 50 && rowH > 22;
      const label = l.name.length > 8 ? l.name.slice(0,7) + "…" : l.name;
      rects.push(
        `<rect x="${curX.toFixed(1)}" y="${curY.toFixed(1)}" width="${w.toFixed(1)}" height="${rowH.toFixed(1)}" rx="4" fill="${e(l.color)}"/>` +
        (showLabel
          ? `<text x="${(curX+w/2).toFixed(1)}" y="${(curY+rowH/2-5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#fff" font-family="${FONT}" opacity="0.95">${e(label)}</text>` +
            `<text x="${(curX+w/2).toFixed(1)}" y="${(curY+rowH/2+9).toFixed(1)}" text-anchor="middle" font-size="10" fill="#fff" font-family="${FONT}" opacity="0.8">${pct(l.percentage)}</text>`
          : "")
      );
      curX += w + GAP;
    });
    curY += rowH + GAP;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    rects.join("") + `</svg>`
  );
}

// ── 10. PIE LIST ─────────────────────────────────────────────────────────────
function renderPieListSvg(langs, title, opts) {
  const t = opts.theme, ht = opts.hideTitle === true, rx = opts.borderRadius ?? 6;
  const titleH = ht ? 0 : TITLE_H;
  const R = 80, CX = PAD_X + R + 4, CY_OFF = R + PAD_Y + 8;
  const CY = titleH + CY_OFF;
  const listX = CX + R + 24;
  const ROW_H = 22;
  const contentH = Math.max(CY_OFF + R + PAD_Y, PAD_Y + langs.length * ROW_H + PAD_Y);
  const totalH = titleH + contentH;
  const brd = opts.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;

  function polar(cx, cy, r, deg) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  let startAngle = 0;
  const wedges = langs.map(l => {
    const sweep = (l.percentage / 100) * 360;
    const end = startAngle + sweep;
    const p1 = polar(CX, CY, R, startAngle);
    const p2 = polar(CX, CY, R, end);
    const la = sweep > 180 ? 1 : 0;
    const path = `M ${CX} ${CY} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${R} ${R} 0 ${la} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
    startAngle = end;
    return `<path d="${path}" fill="${e(l.color)}" stroke="${t.background}" stroke-width="1.5"/>`;
  });

  const holeR = R * 0.45;
  const list = langs.map((l, i) => {
    const ly = titleH + PAD_Y + i * ROW_H + ROW_H / 2;
    return (
      `<text x="${listX}" y="${ly}" dominant-baseline="middle" font-size="11" font-weight="700" fill="${t.value}" font-family="${FONT}">${i+1}.</text>` +
      `<circle cx="${listX + 16}" cy="${ly}" r="4" fill="${e(l.color)}"/>` +
      `<text x="${listX + 24}" y="${ly}" dominant-baseline="middle" font-size="11" fill="${t.text}" font-family="${FONT}">${e(l.name)}</text>` +
      `<text x="${W - PAD_X}" y="${ly}" dominant-baseline="middle" text-anchor="end" font-size="11" font-weight="600" fill="${t.value}" font-family="${FONT}">${pct(l.percentage)}</text>`
    );
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}">` +
    `<rect width="${W}" height="${totalH}" rx="${rx}" fill="${t.background}" ${brd}/>` +
    header(ht, title, t.title, opts.centreTitle===true, t.border) +
    wedges.join("") +
    `<circle cx="${CX}" cy="${CY}" r="${holeR}" fill="${t.background}"/>` +
    list.join("") + `</svg>`
  );
}

// ── Public API ───────────────────────────────────────────────────────────────

export function renderLanguagesSvg(stats, options = {}) {
  const max   = options.maxLanguages ?? 8;
  const langs = (stats.languages ?? []).slice(0, max);
  const title = options.title?.trim() || `${stats.username ?? "GitHub"}'s Top Languages`;

  if (langs.length === 0) {
    const t  = options.theme;
    const rx = options.borderRadius ?? 6;
    const brd = options.hideBorder ? "" : `stroke="${t.border}" stroke-width="1.5"`;
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="80" viewBox="0 0 ${W} 80">` +
      `<rect width="${W}" height="80" rx="${rx}" fill="${t.background}" ${brd}/>` +
      `<text x="${W/2}" y="40" text-anchor="middle" dominant-baseline="middle" font-size="13" fill="${t.text}" font-family="${FONT}">No public language data found for this user.</text>` +
      `</svg>`
    );
  }

  switch (options.layout) {
    case "stacked":          return renderStackedSvg(langs, title, options);
    case "compact":          return renderCompactSvg(langs, title, options);
    case "donut":            return renderDonutSvg(langs, title, options);
    case "donut-vertical":   return renderDonutVerticalSvg(langs, title, options);
    case "horizontal-list":  return renderHorizontalListSvg(langs, title, options);
    case "vertical-list":    return renderVerticalListSvg(langs, title, options);
    case "grid":             return renderGridSvg2(langs, title, options);
    case "treemap":          return renderTreemapSvg(langs, title, options);
    case "pie-list":         return renderPieListSvg(langs, title, options);
    case "bar":
    default:                 return renderBarSvg(langs, title, options);
  }
}

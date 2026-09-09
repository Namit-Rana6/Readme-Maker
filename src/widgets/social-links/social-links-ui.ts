/**
 * Social Links Card builder UI controller.
 * Features:
 *  - Add / remove links
 *  - Drag-handle to reorder links (HTML5 drag-and-drop)
 *  - Custom title, title color, centre-title toggle
 *  - Background color, border color, hide-border toggle
 *  - Border radius slider
 *  - Live preview + generated embed URL
 */
import { renderSocialLinksCard } from "./social-links-widget.ts";
import { PLATFORMS } from "./platforms.ts";

const PROD_BASE = "https://readme-maker-ashen.vercel.app";

// ── URL builder ───────────────────────────────────────────────────────────────

function buildEmbedUrl(
  links:       string[],
  bg:          string,
  radius:      number,
  title:       string,
  titleColor:  string,
  centreTitle: boolean,
  hideBorder:  boolean,
  borderColor: string,
  gridCols:    number,
  cardWidth:   number,
  badgeHeight: number,
  iconsOnly:   boolean,
): string {
  const p = new URLSearchParams();
  for (const l of links.filter(Boolean)) p.append("link", l);
  p.set("bg",     bg);
  p.set("radius", String(radius));
  if (title)                             p.set("title",       title);
  if (titleColor  !== "#a371f7")         p.set("titleColor",  titleColor);
  if (centreTitle)                       p.set("centreTitle", "1");
  if (hideBorder)                        p.set("hideBorder",  "1");
  if (borderColor !== "#30363d")         p.set("borderColor", borderColor);
  if (gridCols    >= 1)                  p.set("cols",        String(gridCols));
  if (gridCols    >= 1 && cardWidth > 0) p.set("maxw",        String(cardWidth));
  if (gridCols    >= 1 && badgeHeight > 0 && badgeHeight !== 36)
                                         p.set("bh",          String(badgeHeight));
  if (iconsOnly)                         p.set("iconsOnly",   "1");
  return `${PROD_BASE}/api/social-card?${p}`;
}

function pushOutputs(
  links: string[], bg: string, radius: number,
  title: string, titleColor: string, centreTitle: boolean,
  hideBorder: boolean, borderColor: string,
  gridCols: number, cardWidth: number, badgeHeight: number,
  iconsOnly: boolean,
  username: string,
): void {
  const url = buildEmbedUrl(links, bg, radius, title, titleColor, centreTitle,
    hideBorder, borderColor, gridCols, cardWidth, badgeHeight, iconsOnly);
  const set = (key: string, val: string) => {
    const el = document.querySelector<HTMLElement>(`[data-generated="${key}"]`);
    if (el) el.textContent = val;
  };
  set("link",     url);
  set("markdown", `![Social links for ${username}](${url})`);
  set("html",     `<img src="${url}" alt="Social links for ${username}" />`);
}

// ── Drag-and-drop helpers ─────────────────────────────────────────────────────

let dragSrc: HTMLElement | null = null;

function onDragStart(this: HTMLElement, e: DragEvent) {
  dragSrc = this;
  this.classList.add("sl-dragging");
  e.dataTransfer?.setData("text/plain", "");
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  return false;
}

function onDragEnter(this: HTMLElement) {
  this.classList.add("sl-drag-over");
}

function onDragLeave(this: HTMLElement) {
  this.classList.remove("sl-drag-over");
}

function onDrop(this: HTMLElement, e: DragEvent, rerenderFn: () => void) {
  e.stopPropagation();
  if (dragSrc && dragSrc !== this) {
    const parent = this.parentNode!;
    const srcIdx = Array.from(parent.children).indexOf(dragSrc);
    const tgtIdx = Array.from(parent.children).indexOf(this);
    if (srcIdx < tgtIdx) {
      parent.insertBefore(dragSrc, this.nextSibling);
    } else {
      parent.insertBefore(dragSrc, this);
    }
    rerenderFn();
  }
  this.classList.remove("sl-drag-over");
  return false;
}

function onDragEnd(this: HTMLElement) {
  this.classList.remove("sl-dragging");
  document.querySelectorAll(".sl-drag-over").forEach((el) => el.classList.remove("sl-drag-over"));
}

// ── Builder init ──────────────────────────────────────────────────────────────

export function initSocialLinksBuilder(
  previewEl:   HTMLElement | null,
  containerEl: HTMLElement | null,
): void {
  if (!previewEl || !containerEl) return;

  // Inject styles once
  if (!document.getElementById("sl-styles")) {
    const s = document.createElement("style");
    s.id = "sl-styles";
    s.textContent = `
      .sl-builder { display:flex; flex-direction:column; gap:0; }
      .sl-section  { padding:18px 22px; border-bottom:1px solid var(--line); }
      .sl-section:last-child { border-bottom:none; }
      .sl-section-title { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); margin-bottom:10px; }
      .sl-hint { font-size:11px; color:var(--muted); margin-bottom:12px; }

      /* link rows */
      .sl-link-rows { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
      .sl-link-row {
        display:flex; align-items:center; gap:6px;
        background:var(--bg2); border:1px solid var(--line2);
        border-radius:8px; padding:4px 8px 4px 4px;
        cursor:default; transition:border-color .12s, opacity .12s;
      }
      .sl-link-row.sl-drag-over  { border-color:var(--accent); background:rgba(124,106,247,.08); }
      .sl-link-row.sl-dragging   { opacity:.45; }

      /* drag handle */
      .sl-drag-handle {
        display:flex; align-items:center; justify-content:center;
        width:24px; height:32px; flex-shrink:0;
        color:var(--muted); font-size:14px; cursor:grab; user-select:none;
        border-radius:5px; transition:color .12s;
      }
      .sl-drag-handle:hover { color:var(--subtle); }
      .sl-drag-handle:active { cursor:grabbing; }

      .sl-link-input {
        flex:1; background:transparent; border:none; outline:none;
        color:var(--text); font:inherit; font-size:12px; padding:6px 4px;
        min-width:0;
      }
      .sl-link-input::placeholder { color:var(--muted); }

      .sl-remove-btn {
        width:24px; height:24px; flex-shrink:0;
        border:0; border-radius:5px; background:transparent;
        color:var(--muted); font-size:11px; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        transition:color .12s, background .12s;
      }
      .sl-remove-btn:hover { color:var(--red); background:rgba(248,113,113,.1); }

      .sl-add-btn {
        border:1px dashed var(--line2); border-radius:7px;
        padding:8px 14px; background:transparent;
        color:var(--subtle); font:inherit; font-size:12px; font-weight:600;
        cursor:pointer; width:100%; text-align:left;
        transition:border-color .12s, color .12s;
      }
      .sl-add-btn:hover { border-color:var(--accent); color:var(--accent2); }

      /* option rows */
      .sl-row { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
      .sl-row:last-child { margin-bottom:0; }
      .sl-label { font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
      .sl-row-right { display:flex; align-items:center; gap:8px; }

      .sl-color-input {
        width:24px; height:24px; flex-shrink:0;
        border:1px solid var(--line2); border-radius:50%; padding:0;
        background:transparent; cursor:pointer;
        appearance:none; -webkit-appearance:none;
      }
      .sl-color-input::-webkit-color-swatch-wrapper { padding:0; border-radius:50%; }
      .sl-color-input::-webkit-color-swatch { border:none; border-radius:50%; }
      .sl-hex { font-size:11px; font-family:monospace; color:var(--subtle); }

      .sl-range { width:110px; accent-color:var(--accent); }
      .sl-range-val { font-size:12px; font-weight:700; color:var(--accent2); min-width:18px; text-align:right; }

      .sl-checks { display:flex; flex-wrap:wrap; gap:10px 18px; margin-top:10px; }
      .sl-check-label { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--subtle); cursor:pointer; }
      .sl-check-label:hover { color:var(--text); }
      .sl-check-label input[type="checkbox"] { width:14px; height:14px; accent-color:var(--accent); cursor:pointer; }

      .sl-text-input {
        width:100%; padding:9px 12px;
        background:var(--bg2); border:1px solid var(--line2);
        border-radius:7px; color:var(--text); font:inherit; font-size:13px; outline:none;
        transition:border-color .15s;
      }
      .sl-text-input:focus { border-color:var(--accent); }
      .sl-text-input::placeholder { color:var(--muted); }

      /* platform chips */
      .sl-platforms { padding:14px 22px; }
      .sl-chips { display:flex; flex-wrap:wrap; gap:5px; margin-top:8px; }
      .sl-chip { display:inline-block; padding:3px 9px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:.04em; }

      /* layout toggle */
      .sl-layout-toggle { display:flex; gap:3px; background:var(--bg); border:1px solid var(--line2); border-radius:7px; padding:3px; }
      .sl-layout-btn { border:0; border-radius:5px; padding:5px 12px; font:inherit; font-size:11px; font-weight:600; color:var(--muted); background:transparent; cursor:pointer; transition:color .12s,background .12s; }
      .sl-layout-btn.active { color:var(--white); background:var(--surface2); box-shadow:0 0 0 1px var(--line2); }

      /* column picker */
      .sl-col-picker { display:flex; gap:3px; }
      .sl-col-btn { width:30px; height:28px; border:1px solid var(--line2); border-radius:6px; background:transparent; color:var(--muted); font:inherit; font-size:12px; font-weight:700; cursor:pointer; transition:color .12s,border-color .12s,background .12s; }
      .sl-col-btn.active { color:var(--white); border-color:var(--accent); background:rgba(124,106,247,.15); }
      .sl-col-btn:hover:not(.active) { color:var(--subtle); background:var(--surface2); }
    `;
    document.head.appendChild(s);
  }

  containerEl.innerHTML = `
    <div class="sl-builder">

      <div class="sl-section">
        <div class="sl-section-title">Your links</div>
        <div class="sl-hint">Drag ⠿ to reorder · auto-detects platform</div>
        <div id="sl-link-rows" class="sl-link-rows"></div>
        <button type="button" id="sl-add-btn" class="sl-add-btn">+ Add link</button>
      </div>

      <div class="sl-section">
        <div class="sl-section-title">Title</div>
        <div style="margin-bottom:10px">
          <label class="sl-label" style="display:block;margin-bottom:6px">
            Custom title <span style="text-transform:none;letter-spacing:0;font-weight:400;color:var(--muted)">(optional)</span>
          </label>
          <input type="text" id="sl-title" class="sl-text-input" placeholder="e.g. Connect with me"/>
        </div>
        <div class="sl-row">
          <span class="sl-label">Title color</span>
          <div class="sl-row-right">
            <input type="color" id="sl-title-color" value="#a371f7" class="sl-color-input"/>
            <span id="sl-title-color-hex" class="sl-hex">#a371f7</span>
          </div>
        </div>
        <div class="sl-checks">
          <label class="sl-check-label"><input type="checkbox" id="sl-centre-title"/> Centre title</label>
        </div>
      </div>

      <div class="sl-section">
        <div class="sl-section-title">Card options</div>
        <div class="sl-row" style="margin-bottom:10px">
          <span class="sl-label">Layout</span>
          <div class="sl-row-right">
            <div class="sl-layout-toggle">
              <button type="button" class="sl-layout-btn active" data-layout="flow">Flow</button>
              <button type="button" class="sl-layout-btn" data-layout="grid">Grid</button>
            </div>
          </div>
        </div>
        <div id="sl-grid-options" style="display:none;margin-bottom:12px;">
          <div class="sl-row" style="margin-bottom:10px">
            <span class="sl-label">Columns</span>
            <div class="sl-row-right">
              <div class="sl-col-picker">
                <button type="button" class="sl-col-btn" data-cols="2">2</button>
                <button type="button" class="sl-col-btn active" data-cols="3">3</button>
                <button type="button" class="sl-col-btn" data-cols="4">4</button>
                <button type="button" class="sl-col-btn" data-cols="5">5</button>
              </div>
            </div>
          </div>
          <div class="sl-row" style="margin-bottom:10px">
            <span class="sl-label">Card width</span>
            <div class="sl-row-right">
              <input type="range" id="sl-card-width" min="400" max="900" step="50" value="500" class="sl-range"/>
              <strong id="sl-card-width-val" class="sl-range-val">500</strong>
            </div>
          </div>
          <div class="sl-row" style="margin-bottom:0">
            <span class="sl-label">Badge height</span>
            <div class="sl-row-right">
              <input type="range" id="sl-badge-height" min="32" max="56" step="4" value="36" class="sl-range"/>
              <strong id="sl-badge-height-val" class="sl-range-val">36</strong>
            </div>
          </div>
        </div>
        <div class="sl-row">
          <span class="sl-label">Background</span>
          <div class="sl-row-right">
            <input type="color" id="sl-bg" value="#0d1117" class="sl-color-input"/>
            <span id="sl-bg-hex" class="sl-hex">#0d1117</span>
          </div>
        </div>
        <div class="sl-row">
          <span class="sl-label">Border color</span>
          <div class="sl-row-right">
            <input type="color" id="sl-border-color" value="#30363d" class="sl-color-input"/>
            <span id="sl-border-color-hex" class="sl-hex">#30363d</span>
          </div>
        </div>
        <div class="sl-row">
          <span class="sl-label">Corner radius</span>
          <div class="sl-row-right">
            <input type="range" id="sl-radius" min="0" max="20" value="10" class="sl-range"/>
            <strong id="sl-radius-val" class="sl-range-val">10</strong>
          </div>
        </div>
        <div class="sl-checks">
          <label class="sl-check-label"><input type="checkbox" id="sl-hide-border"/> Hide border</label>
          <label class="sl-check-label"><input type="checkbox" id="sl-icons-only"/> Icons only</label>
        </div>
      </div>

      <div class="sl-platforms">
        <div class="sl-section-title">Supported platforms</div>
        <div class="sl-chips">${
          PLATFORMS.map((p) =>
            `<span class="sl-chip" style="background:${p.color};color:${p.textColor}">${p.label}</span>`
          ).join("")
        }</div>
      </div>

    </div>
  `;

  // element refs
  const linkRows      = containerEl.querySelector<HTMLElement>("#sl-link-rows")!;
  const addBtn        = containerEl.querySelector<HTMLButtonElement>("#sl-add-btn")!;
  const bgIn          = containerEl.querySelector<HTMLInputElement>("#sl-bg")!;
  const bgHex         = containerEl.querySelector<HTMLElement>("#sl-bg-hex")!;
  const borderColorIn = containerEl.querySelector<HTMLInputElement>("#sl-border-color")!;
  const borderHex     = containerEl.querySelector<HTMLElement>("#sl-border-color-hex")!;
  const radiusIn      = containerEl.querySelector<HTMLInputElement>("#sl-radius")!;
  const radiusLbl     = containerEl.querySelector<HTMLElement>("#sl-radius-val")!;
  const titleIn       = containerEl.querySelector<HTMLInputElement>("#sl-title")!;
  const titleColorIn  = containerEl.querySelector<HTMLInputElement>("#sl-title-color")!;
  const titleColHex   = containerEl.querySelector<HTMLElement>("#sl-title-color-hex")!;
  const centreCb      = containerEl.querySelector<HTMLInputElement>("#sl-centre-title")!;
  const hideBorderCb  = containerEl.querySelector<HTMLInputElement>("#sl-hide-border")!;
  const iconsOnlyCb   = containerEl.querySelector<HTMLInputElement>("#sl-icons-only")!;

  let layoutMode: "flow" | "grid" = "flow";
  let gridCols    = 3;
  let cardWidth   = 500;
  let badgeHeight = 36;

  function getLinks(): string[] {
    return Array.from(linkRows.querySelectorAll<HTMLInputElement>(".sl-link-input"))
      .map((i) => i.value.trim())
      .filter(Boolean);
  }

  function getUsername(): string {
    return (document.getElementById("github-username") as HTMLInputElement | null)?.value.trim() || "user";
  }

  function rerender(): void {
    const svg = renderSocialLinksCard(getLinks(), {
      background:   bgIn.value,
      cardRadius:   Number(radiusIn.value),
      title:        titleIn.value.trim(),
      titleColor:   titleColorIn.value,
      centreTitle:  centreCb.checked,
      hideBorder:   hideBorderCb.checked,
      borderColor:  borderColorIn.value,
      gridCols:     layoutMode === "grid" ? gridCols : 0,
      cardWidth:    layoutMode === "grid" ? cardWidth : undefined,
      badgeHeight:  layoutMode === "grid" ? badgeHeight : undefined,
      iconsOnly:    iconsOnlyCb.checked,
    });
    previewEl.innerHTML = svg;
    pushOutputs(
      getLinks(), bgIn.value, Number(radiusIn.value),
      titleIn.value.trim(), titleColorIn.value,
      centreCb.checked, hideBorderCb.checked, borderColorIn.value,
      layoutMode === "grid" ? gridCols : 0,
      layoutMode === "grid" ? cardWidth : 0,
      layoutMode === "grid" ? badgeHeight : 0,
      iconsOnlyCb.checked,
      getUsername(),
    );
  }

  function addRow(initial = ""): void {
    const row = document.createElement("div");
    row.className  = "sl-link-row";
    row.draggable  = true;
    row.innerHTML  = `
      <span class="sl-drag-handle" title="Drag to reorder">⠿</span>
      <input type="text" class="sl-link-input"
        placeholder="https://github.com/username"
        value="${initial}" spellcheck="false" autocomplete="off"/>
      <button type="button" class="sl-remove-btn" aria-label="Remove">✕</button>
    `;

    // drag events
    row.addEventListener("dragstart",  onDragStart.bind(row) as EventListener);
    row.addEventListener("dragover",   onDragOver);
    row.addEventListener("dragenter",  onDragEnter.bind(row) as EventListener);
    row.addEventListener("dragleave",  onDragLeave.bind(row) as EventListener);
    row.addEventListener("drop",       (e) => { onDrop.call(row, e as DragEvent, rerender); });
    row.addEventListener("dragend",    onDragEnd.bind(row) as EventListener);

    // input / remove
    row.querySelector<HTMLInputElement>(".sl-link-input")!.addEventListener("input", rerender);
    row.querySelector<HTMLButtonElement>(".sl-remove-btn")!.addEventListener("click", () => {
      row.remove();
      rerender();
    });

    linkRows.appendChild(row);
    rerender();
  }

  // control listeners
  addBtn.addEventListener("click",    () => addRow());
  bgIn.addEventListener("input",      () => { bgHex.textContent = bgIn.value; rerender(); });
  borderColorIn.addEventListener("input", () => { borderHex.textContent = borderColorIn.value; rerender(); });
  radiusIn.addEventListener("input",  () => { radiusLbl.textContent = radiusIn.value; rerender(); });
  titleIn.addEventListener("input",   rerender);
  titleColorIn.addEventListener("input", () => { titleColHex.textContent = titleColorIn.value; rerender(); });
  centreCb.addEventListener("change",    rerender);
  hideBorderCb.addEventListener("change", rerender);
  iconsOnlyCb.addEventListener("change",  rerender);

  // layout toggle
  const gridOptionsEl  = containerEl.querySelector<HTMLElement>("#sl-grid-options")!;
  const cardWidthIn    = containerEl.querySelector<HTMLInputElement>("#sl-card-width")!;
  const cardWidthLbl   = containerEl.querySelector<HTMLElement>("#sl-card-width-val")!;
  const badgeHeightIn  = containerEl.querySelector<HTMLInputElement>("#sl-badge-height")!;
  const badgeHeightLbl = containerEl.querySelector<HTMLElement>("#sl-badge-height-val")!;

  cardWidthIn.addEventListener("input",   () => { cardWidth = Number(cardWidthIn.value); cardWidthLbl.textContent = cardWidthIn.value; rerender(); });
  badgeHeightIn.addEventListener("input", () => { badgeHeight = Number(badgeHeightIn.value); badgeHeightLbl.textContent = badgeHeightIn.value; rerender(); });

  containerEl.querySelectorAll<HTMLButtonElement>(".sl-layout-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      containerEl.querySelectorAll(".sl-layout-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      layoutMode = (btn.dataset.layout ?? "flow") as "flow" | "grid";
      gridOptionsEl.style.display = layoutMode === "grid" ? "block" : "none";
      rerender();
    });
  });

  // column picker
  containerEl.querySelectorAll<HTMLButtonElement>(".sl-col-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      containerEl.querySelectorAll(".sl-col-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      gridCols = Number(btn.dataset.cols ?? 3);
      rerender();
    });
  });

  // seed
  addRow("https://github.com/");
  addRow("https://linkedin.com/in/");
}

export function teardownSocialLinksBuilder(containerEl: HTMLElement | null): void {
  if (containerEl) containerEl.innerHTML = "";
  dragSrc = null;
}

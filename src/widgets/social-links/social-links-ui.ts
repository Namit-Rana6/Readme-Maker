/**
 * Social Links Card builder UI controller.
 * Completely isolated — does not touch any stats card code.
 *
 * Mount point: call initSocialLinksBuilder() when the Badge tab is active.
 */
import { renderSocialLinksCard } from "./social-links-widget.ts";
import { PLATFORMS } from "./platforms.ts";

const PROD_BASE = "https://readme-maker-ashen.vercel.app";

/**
 * Build the embed URL for the social links card.
 * In production it points to the Vercel deployment.
 * Encodes links as repeated `link=` params.
 */
function buildSocialEmbedUrl(links: string[], bg: string, radius: number): string {
  const base = typeof window !== "undefined"
    ? "https://readme-maker-ashen.vercel.app"
    : PROD_BASE;
  const params = new URLSearchParams();
  for (const l of links.filter(Boolean)) params.append("link", l);
  params.set("bg", bg);
  params.set("radius", String(radius));
  return `${base}/api/social-card?${params}`;
}

function updateOutputs(
  links: string[],
  bg: string,
  radius: number,
  username: string,
): void {
  const url = buildSocialEmbedUrl(links, bg, radius);
  const markdown = `![Social links for ${username}](${url})`;
  const html     = `<img src="${url}" alt="Social links for ${username}" />`;

  const set = (sel: string, val: string) => {
    const el = document.querySelector<HTMLElement>(`[data-generated="${sel}"]`);
    if (el) el.textContent = val;
  };
  set("link",     url);
  set("markdown", markdown);
  set("html",     html);
}

export function initSocialLinksBuilder(
  previewEl: HTMLElement | null,
  containerEl: HTMLElement | null,
): void {
  if (!previewEl || !containerEl) return;

  // Render the builder UI into containerEl
  containerEl.innerHTML = `
    <div class="sl-builder">

      <div class="sl-section">
        <div class="sl-section-title">Your links</div>
        <div class="sl-hint">Add one URL per line. We auto-detect the platform.</div>
        <div id="sl-link-rows" class="sl-link-rows"></div>
        <button type="button" id="sl-add-btn" class="sl-add-btn">+ Add link</button>
      </div>

      <div class="sl-section">
        <div class="sl-section-title">Card options</div>
        <div class="sl-row">
          <label class="sl-label" for="sl-bg">Background</label>
          <div class="sl-row-right">
            <input type="color" id="sl-bg" value="#0d1117" class="sl-color-input"/>
            <span id="sl-bg-hex" class="sl-hex-label">#0d1117</span>
          </div>
        </div>
        <div class="sl-row">
          <label class="sl-label" for="sl-radius">Corner radius</label>
          <div class="sl-row-right">
            <input type="range" id="sl-radius" min="0" max="20" value="10" class="sl-range"/>
            <strong id="sl-radius-val" class="sl-range-val">10</strong>
          </div>
        </div>
      </div>

      <div class="sl-platforms">
        <div class="sl-section-title">Supported platforms</div>
        <div class="sl-platform-chips">${PLATFORMS.map((p) =>
          `<span class="sl-chip" style="background:${p.color};color:${p.textColor}">${p.label}</span>`
        ).join("")}</div>
      </div>

    </div>
  `;

  const linkRows = containerEl.querySelector<HTMLElement>("#sl-link-rows")!;
  const addBtn   = containerEl.querySelector<HTMLButtonElement>("#sl-add-btn")!;
  const bgInput  = containerEl.querySelector<HTMLInputElement>("#sl-bg")!;
  const bgHex    = containerEl.querySelector<HTMLElement>("#sl-bg-hex")!;
  const radiusIn = containerEl.querySelector<HTMLInputElement>("#sl-radius")!;
  const radiusLbl= containerEl.querySelector<HTMLElement>("#sl-radius-val")!;

  let rows: HTMLElement[] = [];

  function getLinks(): string[] {
    return rows
      .map((r) => r.querySelector<HTMLInputElement>(".sl-link-input")?.value.trim() ?? "")
      .filter(Boolean);
  }

  function getUsername(): string {
    return (document.getElementById("github-username") as HTMLInputElement | null)
      ?.value.trim() || "user";
  }

  function rerender(): void {
    const links  = getLinks();
    const bg     = bgInput.value;
    const radius = Number(radiusIn.value);
    const svg    = renderSocialLinksCard(links, { background: bg, cardRadius: radius });
    previewEl.innerHTML = svg;
    updateOutputs(links, bg, radius, getUsername());
  }

  function addRow(initialValue = ""): void {
    const row = document.createElement("div");
    row.className = "sl-link-row";
    row.innerHTML = `
      <input type="text" class="sl-link-input" placeholder="https://github.com/username" value="${initialValue}" spellcheck="false" autocomplete="off"/>
      <button type="button" class="sl-remove-btn" aria-label="Remove link">✕</button>
    `;
    const input  = row.querySelector<HTMLInputElement>(".sl-link-input")!;
    const remove = row.querySelector<HTMLButtonElement>(".sl-remove-btn")!;

    input.addEventListener("input", rerender);
    remove.addEventListener("click", () => {
      rows = rows.filter((r) => r !== row);
      row.remove();
      rerender();
    });

    linkRows.appendChild(row);
    rows.push(row);
    rerender();
  }

  addBtn.addEventListener("click", () => addRow());
  bgInput.addEventListener("input", () => {
    bgHex.textContent = bgInput.value;
    rerender();
  });
  radiusIn.addEventListener("input", () => {
    radiusLbl.textContent = radiusIn.value;
    rerender();
  });

  // Seed with common platforms
  addRow("https://github.com/");
  addRow("https://linkedin.com/in/");
}

export function teardownSocialLinksBuilder(containerEl: HTMLElement | null): void {
  if (containerEl) containerEl.innerHTML = "";
}

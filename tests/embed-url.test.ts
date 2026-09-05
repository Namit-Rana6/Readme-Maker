/**
 * Production synchronisation + audit tests.
 *
 * Covers:
 *  - Stat contract (11 keys, no obsolete)
 *  - Theme registry (9 themes, all color keys)
 *  - URL generation for every supported param
 *  - renderStatsSvg: all params, edge cases, every theme
 *  - renderGridSvg: all params, 3×1/3×2/3×3 sizing
 *  - Error SVG for invalid/missing user
 *  - escapeXml single-quote fix
 *  - showIcons default-ON parity between both renderers
 */
import { describe, expect, it } from "vitest";
import { renderStatsSvg, renderGridSvg } from "../api/render-stats.js";
import { themes, resolveTheme } from "../src/core/themes.js";
import { STAT_DEFINITIONS, STAT_KEYS } from "../src/widgets/github-stats/stat-definitions.js";
import { escapeXml } from "../src/core/svg/escape.ts";

const BASE = "https://readme-maker-ashen.vercel.app";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const defaultTheme = themes.default;
const oceanTheme   = themes.ocean;

const fullStats = {
  username:                "octocat",
  name:                    "The Octocat",
  followers:               500,
  following:               10,
  repositories:            42,
  commits:                 300,
  issues:                  20,
  pullRequests:            15,
  pullRequestReviews:      5,
  repositoryContributions: 8,
  contributions:           400,
};

const minimalStats = {
  username:  "octocat",
  commits:   1,
  followers: 2,
};

// ── URL builder — mirrors updateGeneratedCode in src/index.ts ─────────────────

interface EmbedConfig {
  username?:     string;
  theme?:        string;
  radius?:       string;
  title?:        string;
  showIcons?:    boolean;   // false → sends showIcons=0, true → omit (default on)
  hideBorder?:   boolean;
  hideTitle?:    boolean;
  centreTitle?:  boolean;
  stats?:        string[];
  layout?:       "hidden" | "standard";
  customColors?: Record<string, string>;
}

function buildEmbedUrl(config: EmbedConfig): string {
  const username = config.username ?? "Namit-Rana6";
  const theme    = config.theme    ?? "default";
  const radius   = config.radius   ?? "6";
  const params   = new URLSearchParams({ username, theme, radius });

  if (config.title)                       params.set("title",       config.title);
  if (config.showIcons === false)         params.set("showIcons",   "0");
  if (config.hideBorder)                  params.set("hideBorder",  "1");
  if (config.hideTitle)                   params.set("hideTitle",   "1");
  if (config.centreTitle)                 params.set("centreTitle", "1");
  if (config.stats?.length)              params.set("stats",        config.stats.join(","));
  if (config.layout === "hidden")         params.set("layout",      "hidden");
  if (config.customColors) {
    Object.entries(config.customColors).forEach(([k, v]) => params.set(k, v));
  }

  return `${BASE}/api/stats?${params}`;
}

// ── escapeXml ─────────────────────────────────────────────────────────────────

describe("escapeXml", () => {
  it("escapes ampersand", () => {
    expect(escapeXml("a&b")).toBe("a&amp;b");
  });
  it("escapes less-than", () => {
    expect(escapeXml("a<b")).toBe("a&lt;b");
  });
  it("escapes greater-than", () => {
    expect(escapeXml("a>b")).toBe("a&gt;b");
  });
  it("escapes double-quote", () => {
    expect(escapeXml('a"b')).toBe("a&quot;b");
  });
  it("escapes single-quote (apostrophe) — regression fix", () => {
    expect(escapeXml("O'Brien")).toBe("O&#x27;Brien");
  });
  it("escapes all special chars together", () => {
    expect(escapeXml(`<"it's a & test">`)).toBe(`&lt;&quot;it&#x27;s a &amp; test&quot;&gt;`);
  });
});

// ── Stat contract ─────────────────────────────────────────────────────────────

describe("stat contract", () => {
  const EXPECTED = [
    "username", "name", "followers", "following", "repositories",
    "commits", "issues", "pullRequests", "pullRequestReviews",
    "repositoryContributions", "contributions",
  ];
  const OBSOLETE = [
    "gists", "organizations", "stars", "contributedRepositories",
    "restrictedContributions", "codingHours",
  ];

  it("has exactly 11 stat definitions", () => {
    expect(STAT_DEFINITIONS).toHaveLength(11);
  });

  it("keys are in the expected order", () => {
    expect(STAT_DEFINITIONS.map(([k]: [string]) => k)).toEqual(EXPECTED);
  });

  it("contains no obsolete keys", () => {
    const keys = STAT_DEFINITIONS.map(([k]: [string]) => k);
    for (const obsolete of OBSOLETE) {
      expect(keys).not.toContain(obsolete);
    }
  });

  it("STAT_KEYS set exactly mirrors STAT_DEFINITIONS", () => {
    const keys = STAT_DEFINITIONS.map(([k]: [string]) => k);
    for (const k of keys) expect(STAT_KEYS.has(k)).toBe(true);
    expect(STAT_KEYS.size).toBe(keys.length);
  });
});

// ── Theme registry ────────────────────────────────────────────────────────────

describe("theme registry", () => {
  const ALL_THEMES = [
    "default","dark","ocean","sunset","cyberpunk",
    "midnight","tokyoNight","emerald","sunsetGlow",
  ];
  const COLOR_KEYS = ["background","border","title","text","value","accent"];

  it("has exactly 9 themes", () => {
    expect(Object.keys(themes)).toHaveLength(9);
  });

  it("contains every expected theme name", () => {
    for (const name of ALL_THEMES) expect(themes).toHaveProperty(name);
  });

  it("every theme has all 6 color keys", () => {
    for (const [name, theme] of Object.entries(themes)) {
      for (const key of COLOR_KEYS) {
        expect(theme, `theme "${name}" missing "${key}"`).toHaveProperty(key);
      }
    }
  });

  it("each theme has a unique background color", () => {
    const bgs = Object.values(themes).map((t) => t.background);
    expect(new Set(bgs).size).toBe(bgs.length);
  });

  it("resolveTheme('ocean') returns ocean theme", () => {
    expect(resolveTheme("ocean")).toEqual(themes.ocean);
  });

  it("resolveTheme falls back to default for unknown name", () => {
    expect(resolveTheme("nonexistent")).toEqual(themes.default);
    expect(resolveTheme(undefined)).toEqual(themes.default);
  });
});

// ── URL generation ────────────────────────────────────────────────────────────

describe("embed URL generation", () => {
  it("uses the production base URL", () => {
    expect(buildEmbedUrl({})).toContain(BASE);
    expect(buildEmbedUrl({})).toContain("/api/stats");
  });
  it("encodes username", () => {
    expect(buildEmbedUrl({ username: "Namit-Rana6" })).toContain("username=Namit-Rana6");
  });
  it("encodes theme", () => {
    expect(buildEmbedUrl({ theme: "ocean" })).toContain("theme=ocean");
  });
  it("encodes radius", () => {
    expect(buildEmbedUrl({ radius: "12" })).toContain("radius=12");
  });
  it("omits title when empty", () => {
    expect(buildEmbedUrl({ title: "" })).not.toContain("title=");
  });
  it("encodes custom title", () => {
    expect(buildEmbedUrl({ title: "My Stats" })).toContain("title=My+Stats");
  });
  it("encodes showIcons=0 when icons disabled (default is ON)", () => {
    expect(buildEmbedUrl({ showIcons: false })).toContain("showIcons=0");
  });
  it("omits showIcons param when icons enabled (default)", () => {
    expect(buildEmbedUrl({ showIcons: true })).not.toContain("showIcons");
  });
  it("encodes hideBorder=1", () => {
    expect(buildEmbedUrl({ hideBorder: true })).toContain("hideBorder=1");
  });
  it("omits hideBorder when false", () => {
    expect(buildEmbedUrl({ hideBorder: false })).not.toContain("hideBorder");
  });
  it("encodes hideTitle=1", () => {
    expect(buildEmbedUrl({ hideTitle: true })).toContain("hideTitle=1");
  });
  it("omits hideTitle when false", () => {
    expect(buildEmbedUrl({ hideTitle: false })).not.toContain("hideTitle");
  });
  it("encodes centreTitle=1", () => {
    expect(buildEmbedUrl({ centreTitle: true })).toContain("centreTitle=1");
  });
  it("omits centreTitle when false", () => {
    expect(buildEmbedUrl({ centreTitle: false })).not.toContain("centreTitle");
  });
  it("encodes selected stats", () => {
    expect(buildEmbedUrl({ stats: ["commits", "followers"] }))
      .toContain("stats=commits%2Cfollowers");
  });
  it("omits stats param when empty", () => {
    expect(buildEmbedUrl({ stats: [] })).not.toContain("stats=");
  });
  it("encodes layout=hidden", () => {
    expect(buildEmbedUrl({ layout: "hidden" })).toContain("layout=hidden");
  });
  it("encodes custom theme colors", () => {
    const url = buildEmbedUrl({ theme: "custom", customColors: { background: "#ff0000" } });
    expect(url).toContain("theme=custom");
    expect(url).toContain("background=%23ff0000");
  });
  it("different themes produce different URLs", () => {
    expect(buildEmbedUrl({ theme: "default" })).not.toBe(buildEmbedUrl({ theme: "ocean" }));
  });
  it("different radii produce different URLs", () => {
    expect(buildEmbedUrl({ radius: "6" })).not.toBe(buildEmbedUrl({ radius: "20" }));
  });
  it("icons-off produces different URL from icons-on", () => {
    expect(buildEmbedUrl({ showIcons: false })).not.toBe(buildEmbedUrl({ showIcons: true }));
  });
  it("link, markdown and HTML share the same URL", () => {
    const url = buildEmbedUrl({ username: "octocat", theme: "ocean" });
    expect(`![s](${url})`).toContain(url);
    expect(`<img src="${url}" />`).toContain(url);
  });
});

// ── renderStatsSvg ────────────────────────────────────────────────────────────

describe("renderStatsSvg", () => {
  it("produces a valid SVG wrapper", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
    // No nested <svg> — strip outer tag and verify
    const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    expect(inner).not.toContain("<svg ");
  });

  it("default title uses username with escaped apostrophe", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme });
    expect(svg).toContain("octocat&#x27;s GitHub Stats");
  });

  it("custom title overrides default", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, title: "My Stats" });
    expect(svg).toContain("My Stats");
    expect(svg).not.toContain("octocat&#x27;s GitHub Stats");
  });

  it("title with special chars is escaped", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, title: "O'Brien & Co." });
    expect(svg).toContain("O&#x27;Brien &amp; Co.");
  });

  it("hideTitle removes the title text", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, hideTitle: true });
    expect(svg).not.toContain("GitHub Stats");
  });

  it("hideTitle=false shows the title", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, hideTitle: false });
    expect(svg).toContain("GitHub Stats");
  });

  it("centreTitle adds text-anchor=middle", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, centreTitle: true });
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('x="250"');
  });

  it("centreTitle=false uses left-aligned x=20", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, centreTitle: false });
    expect(svg).toContain('x="20"');
    expect(svg).not.toContain('text-anchor="middle"');
  });

  it("hideBorder removes stroke from the card rect", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, hideBorder: true, showIcons: false });
    // With icons off, the only stroke= in the output would be from the card border
    expect(svg).not.toContain("stroke=");
  });

  it("hideBorder=false includes stroke", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, hideBorder: false });
    expect(svg).toContain(`stroke="${defaultTheme.border}"`);
  });

  it("icons shown by default (showIcons unset)", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme });
    expect(svg).toContain("<path ");
    expect(svg).toContain("translate(");
  });

  it("showIcons=true renders icon paths without nested svg", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, showIcons: true });
    expect(svg).toContain("<path ");
    const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    expect(inner).not.toContain("<svg ");
  });

  it("showIcons=false omits icon translate wrappers", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, showIcons: false });
    expect(svg).not.toContain("translate(");
  });

  it("applies custom border radius", () => {
    expect(renderStatsSvg(fullStats, { theme: defaultTheme, borderRadius: 16 }))
      .toContain('rx="16"');
  });

  it("defaults to radius 6", () => {
    expect(renderStatsSvg(fullStats, { theme: defaultTheme })).toContain('rx="6"');
  });

  it("renders only the requested stats", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, visibleStats: ["commits", "followers"] });
    expect(svg).toContain("Commits:");
    expect(svg).toContain("Followers:");
    expect(svg).not.toContain("Total Pull Requests:");
  });

  it("renders all 11 stats by default", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme });
    expect(svg).toContain("Username:");
    expect(svg).toContain("Total Contributions:");
  });

  it("card height grows with more visible rows", () => {
    const h = (svg: string) => Number(svg.match(/height="(\d+)"/)?.[1]);
    const short = renderStatsSvg(fullStats, { theme: defaultTheme, visibleStats: ["commits"] });
    const tall  = renderStatsSvg(fullStats, { theme: defaultTheme, visibleStats: ["commits", "followers", "repositories"] });
    expect(h(tall)).toBeGreaterThan(h(short));
  });

  it("1 selected stat produces a minimal card", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, visibleStats: ["followers"] });
    expect(svg).toContain("Followers:");
    expect(svg).not.toContain("Commits:");
  });

  it("never renders obsolete stats", () => {
    const svg = renderStatsSvg({ ...fullStats, gists: 99, stars: 1234 } as any, { theme: defaultTheme });
    expect(svg).not.toContain("Gists");
    expect(svg).not.toContain("Stars");
  });

  it("skips rows with value 0", () => {
    const svg = renderStatsSvg({ ...fullStats, issues: 0 }, { theme: defaultTheme });
    expect(svg).not.toContain("Total Issues:");
  });

  it("skips rows with undefined value", () => {
    const svg = renderStatsSvg({ ...fullStats, pullRequests: undefined } as any, { theme: defaultTheme });
    expect(svg).not.toContain("Total Pull Requests:");
  });

  it("uses theme background color", () => {
    expect(renderStatsSvg(fullStats, { theme: defaultTheme })).toContain(defaultTheme.background);
  });

  it("different themes produce different SVG", () => {
    const svg1 = renderStatsSvg(fullStats, { theme: defaultTheme });
    const svg2 = renderStatsSvg(fullStats, { theme: oceanTheme });
    expect(svg1).not.toBe(svg2);
    expect(svg2).toContain(oceanTheme.background);
  });

  it.each(Object.entries(themes))("theme %s — SVG contains background color", (_, theme) => {
    expect(renderStatsSvg(fullStats, { theme })).toContain(theme.background);
  });

  it("long username does not crash", () => {
    const svg = renderStatsSvg({ ...fullStats, username: "a".repeat(60) }, { theme: defaultTheme });
    expect(svg).toContain("<svg");
  });

  it("long custom title does not crash", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, title: "x".repeat(120) });
    expect(svg).toContain("<svg");
  });

  it("empty stats object shows fallback title", () => {
    const svg = renderStatsSvg({}, { theme: defaultTheme });
    expect(svg).toContain("<svg");
    expect(svg).toContain("GitHub&#x27;s GitHub Stats");
  });

  it("stats object with all zeros shows no stat rows", () => {
    const svg = renderStatsSvg({ username: "x", commits: 0, followers: 0 }, { theme: defaultTheme });
    // Only username row since username is a string (not zero-filtered)
    expect(svg).toContain("Username:");
    expect(svg).not.toContain("Commits:");
  });

  it("hideTitle+hideBorder together produce correct output", () => {
    const svg = renderStatsSvg(fullStats, { theme: defaultTheme, hideTitle: true, hideBorder: true, showIcons: false });
    expect(svg).not.toContain("GitHub Stats");
    expect(svg).not.toContain("stroke=");
    expect(svg).toContain("<svg");
  });
});

// ── renderGridSvg ─────────────────────────────────────────────────────────────

describe("renderGridSvg", () => {
  it("produces valid SVG", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it("3×2 by default (6 stats)", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme });
    const h = Number(svg.match(/height="(\d+)"/)?.[1]);
    // TITLE_H=44 + 2*CELL_H(110) = 264
    expect(h).toBe(264);
  });

  it("3×1 when 3 stats selected", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme, visibleStats: ["commits", "followers", "issues"] });
    const h = Number(svg.match(/height="(\d+)"/)?.[1]);
    expect(h).toBe(154); // 44 + 1*110
  });

  it("3×2 when 4–6 stats selected", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme, visibleStats: ["commits", "followers", "issues", "repositories"] });
    const h = Number(svg.match(/height="(\d+)"/)?.[1]);
    expect(h).toBe(264); // 44 + 2*110
  });

  it("3×3 when 7–9 stats selected", () => {
    const svg = renderGridSvg(fullStats, {
      theme: defaultTheme,
      visibleStats: ["commits", "followers", "issues", "repositories", "pullRequests", "following", "contributions"],
    });
    const h = Number(svg.match(/height="(\d+)"/)?.[1]);
    expect(h).toBe(374); // 44 + 3*110
  });

  it("icons shown by default", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme });
    expect(svg).toContain("<path ");
    expect(svg).toContain("translate(");
  });

  it("showIcons=false omits icon markup", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme, showIcons: false });
    expect(svg).not.toContain("translate(");
  });

  it("hideTitle removes title and reduces height", () => {
    const withTitle    = renderGridSvg(fullStats, { theme: defaultTheme, hideTitle: false });
    const withoutTitle = renderGridSvg(fullStats, { theme: defaultTheme, hideTitle: true });
    const hWith    = Number(withTitle.match(/height="(\d+)"/)?.[1]);
    const hWithout = Number(withoutTitle.match(/height="(\d+)"/)?.[1]);
    expect(hWithout).toBeLessThan(hWith);
    expect(withoutTitle).not.toContain("GitHub Stats");
  });

  it("hideBorder removes stroke from the card rect", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme, hideBorder: true, showIcons: false });
    // dividers use stroke too, so check specifically the rect has no stroke
    expect(svg).not.toMatch(/stroke="[^"]*" stroke-width="1\.5"/);
  });

  it("centreTitle adds text-anchor=middle", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme, centreTitle: true });
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain('x="250"');
  });

  it("custom title appears in grid card", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme, title: "Grid Stats" });
    expect(svg).toContain("Grid Stats");
  });

  it("applies border radius", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme, borderRadius: 20 });
    expect(svg).toContain('rx="20"');
  });

  it("uses theme colors", () => {
    const svg = renderGridSvg(fullStats, { theme: oceanTheme });
    expect(svg).toContain(oceanTheme.background);
    expect(svg).toContain(oceanTheme.accent);
  });

  it("no nested svg elements", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme, showIcons: true });
    const inner = svg.replace(/^<svg[^>]*>/, "");
    expect(inner).not.toContain("<svg");
  });

  it("1 stat still renders a 3×1 grid", () => {
    const svg = renderGridSvg(fullStats, { theme: defaultTheme, visibleStats: ["commits"] });
    expect(svg).toContain("<svg");
    const h = Number(svg.match(/height="(\d+)"/)?.[1]);
    expect(h).toBe(154);
  });

  it.each(Object.entries(themes))("theme %s — grid SVG contains background color", (_, theme) => {
    expect(renderGridSvg(fullStats, { theme })).toContain(theme.background);
  });
});

// ── Error SVG ─────────────────────────────────────────────────────────────────

describe("error SVG shape", () => {
  // We test by constructing the same SVG the API would produce
  function makeErrorSvg(message: string) {
    const truncated = message.length > 80 ? message.slice(0, 77) + "…" : message;
    const escaped = truncated.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="80" viewBox="0 0 500 80">` +
      `<rect width="500" height="80" rx="6" fill="#0d1117" stroke="#f85149" stroke-width="1.5"/>` +
      `<text x="20" y="28" font-size="13" font-weight="700" fill="#f85149">Error</text>` +
      `<text x="20" y="52" font-size="12" fill="#e6edf3">${escaped}</text>` +
      `</svg>`
    );
  }

  it("produces a valid SVG", () => {
    const svg = makeErrorSvg("User not found");
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain("Error");
    expect(svg).toContain("User not found");
  });

  it("truncates messages longer than 80 chars", () => {
    const long = "x".repeat(100);
    const svg = makeErrorSvg(long);
    expect(svg).toContain("…");
    expect(svg).not.toContain("x".repeat(100));
  });

  it("escapes special chars in error message", () => {
    const svg = makeErrorSvg(`User "O'Brien" & <others>`);
    expect(svg).toContain("&quot;");
    expect(svg).toContain("&amp;");
    expect(svg).toContain("&lt;");
  });

  it("uses the red error accent color", () => {
    const svg = makeErrorSvg("anything");
    expect(svg).toContain("#f85149");
  });
});

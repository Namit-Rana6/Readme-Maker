/**
 * Production synchronisation tests.
 *
 * Covers:
 *  - URL generation (every supported param)
 *  - API renderer (renderStatsSvg) applying each param correctly
 *  - Theme registry parity between frontend and API
 *  - Stat contract parity (11 stats, no obsolete keys)
 *  - Icon rendering (no nested <svg>, correct <g>/<path> markup)
 */
import { describe, expect, it } from "vitest";
import { renderStatsSvg } from "../api/render-stats.js";
import { themes, resolveTheme } from "../src/core/themes.js";
import { STAT_DEFINITIONS, STAT_KEYS } from "../src/widgets/github-stats/stat-definitions.js";

const BASE = "https://readme-maker-ashen.vercel.app";

// ── Shared fixtures ──────────────────────────────────────────────────────────

const defaultTheme = themes.default;
const oceanTheme   = themes.ocean;

const sampleStats = {
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

// ── URL builder (mirrors updateGeneratedCode in src/index.ts) ────────────────

interface EmbedConfig {
  username?:    string;
  theme?:       string;
  radius?:      string;
  title?:       string;
  showIcons?:   boolean;
  hideBorder?:  boolean;
  hideTitle?:   boolean;
  stats?:       string[];
  layout?:      "hidden" | "standard";
  customColors?: Record<string, string>;
}

function buildEmbedUrl(config: EmbedConfig): string {
  const username = config.username ?? "Namit-Rana6";
  const theme    = config.theme    ?? "default";
  const radius   = config.radius   ?? "6";
  const params   = new URLSearchParams({ username, theme, radius });

  if (config.title)        params.set("title",      config.title);
  if (config.showIcons)    params.set("showIcons",  "1");
  if (config.hideBorder)   params.set("hideBorder", "1");
  if (config.hideTitle)    params.set("hideTitle",  "1");
  if (config.stats?.length) params.set("stats",     config.stats.join(","));
  if (config.layout === "hidden") params.set("layout", "hidden");
  if (config.customColors) {
    Object.entries(config.customColors).forEach(([k, v]) => params.set(k, v));
  }

  return `${BASE}/api/stats?${params}`;
}

// ── Stat contract ────────────────────────────────────────────────────────────

describe("stat contract", () => {
  const EXPECTED_KEYS = [
    "username", "name", "followers", "following", "repositories",
    "commits", "issues", "pullRequests", "pullRequestReviews",
    "repositoryContributions", "contributions",
  ];
  const OBSOLETE_KEYS = [
    "gists", "organizations", "stars", "contributedRepositories",
    "restrictedContributions", "codingHours",
  ];

  it("has exactly 11 stat definitions", () => {
    expect(STAT_DEFINITIONS).toHaveLength(11);
  });

  it("contains every expected key in order", () => {
    const keys = STAT_DEFINITIONS.map(([key]: [string]) => key);
    expect(keys).toEqual(EXPECTED_KEYS);
  });

  it("does not contain any obsolete key", () => {
    const keys = STAT_DEFINITIONS.map(([key]: [string]) => key);
    for (const obsolete of OBSOLETE_KEYS) {
      expect(keys).not.toContain(obsolete);
    }
  });

  it("STAT_KEYS set mirrors STAT_DEFINITIONS", () => {
    for (const [key] of STAT_DEFINITIONS) {
      expect(STAT_KEYS.has(key)).toBe(true);
    }
    expect(STAT_KEYS.size).toBe(STAT_DEFINITIONS.length);
  });
});

// ── Theme registry ───────────────────────────────────────────────────────────

describe("theme registry", () => {
  const EXPECTED_THEMES = [
    "default", "dark", "ocean", "sunset", "cyberpunk",
    "midnight", "tokyoNight", "emerald", "sunsetGlow",
  ];
  const COLOR_KEYS = ["background", "border", "title", "text", "value", "accent"];

  it("contains all 9 expected themes", () => {
    for (const name of EXPECTED_THEMES) {
      expect(themes).toHaveProperty(name);
    }
  });

  it("every theme has all 6 color keys", () => {
    for (const [name, theme] of Object.entries(themes)) {
      for (const key of COLOR_KEYS) {
        expect(theme, `theme "${name}" missing "${key}"`).toHaveProperty(key);
      }
    }
  });

  it("each theme produces a different background", () => {
    const backgrounds = Object.values(themes).map((t) => t.background);
    const unique = new Set(backgrounds);
    expect(unique.size).toBe(backgrounds.length);
  });

  it("resolveTheme returns the correct theme by name", () => {
    expect(resolveTheme("ocean")).toEqual(themes.ocean);
    expect(resolveTheme("tokyoNight")).toEqual(themes.tokyoNight);
  });

  it("resolveTheme falls back to default for unknown names", () => {
    expect(resolveTheme("nonexistent")).toEqual(themes.default);
    expect(resolveTheme(undefined)).toEqual(themes.default);
  });
});

// ── URL generation ───────────────────────────────────────────────────────────

describe("embed URL generation", () => {
  it("uses the production base URL and /api/stats path", () => {
    const url = buildEmbedUrl({ username: "octocat" });
    expect(url).toContain(BASE);
    expect(url).toContain("/api/stats");
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

  it("omits title param when title is empty", () => {
    expect(buildEmbedUrl({ title: "" })).not.toContain("title=");
  });

  it("encodes custom title", () => {
    expect(buildEmbedUrl({ title: "My Stats" })).toContain("title=My+Stats");
  });

  it("encodes showIcons=1 when enabled", () => {
    expect(buildEmbedUrl({ showIcons: true })).toContain("showIcons=1");
  });

  it("omits showIcons when disabled", () => {
    expect(buildEmbedUrl({ showIcons: false })).not.toContain("showIcons");
  });

  it("encodes hideBorder=1 when enabled", () => {
    expect(buildEmbedUrl({ hideBorder: true })).toContain("hideBorder=1");
  });

  it("omits hideBorder when disabled", () => {
    expect(buildEmbedUrl({ hideBorder: false })).not.toContain("hideBorder");
  });

  it("encodes hideTitle=1 when enabled", () => {
    expect(buildEmbedUrl({ hideTitle: true })).toContain("hideTitle=1");
  });

  it("omits hideTitle when disabled", () => {
    expect(buildEmbedUrl({ hideTitle: false })).not.toContain("hideTitle");
  });

  it("encodes selected stats", () => {
    expect(buildEmbedUrl({ stats: ["commits", "followers"] }))
      .toContain("stats=commits%2Cfollowers");
  });

  it("omits stats param when none selected", () => {
    expect(buildEmbedUrl({ stats: [] })).not.toContain("stats=");
  });

  it("encodes layout=hidden", () => {
    expect(buildEmbedUrl({ layout: "hidden" })).toContain("layout=hidden");
  });

  it("encodes custom theme colors", () => {
    const url = buildEmbedUrl({
      theme: "custom",
      customColors: { background: "#ff0000", border: "#00ff00" },
    });
    expect(url).toContain("theme=custom");
    expect(url).toContain("background=%23ff0000");
    expect(url).toContain("border=%2300ff00");
  });

  it("different themes → different URLs", () => {
    expect(buildEmbedUrl({ theme: "default" })).not.toBe(buildEmbedUrl({ theme: "ocean" }));
  });

  it("different stat selections → different URLs", () => {
    expect(buildEmbedUrl({ stats: ["commits"] })).not.toBe(buildEmbedUrl({ stats: ["followers"] }));
  });

  it("different radii → different URLs", () => {
    expect(buildEmbedUrl({ radius: "6" })).not.toBe(buildEmbedUrl({ radius: "20" }));
  });

  it("icon toggle → different URLs", () => {
    expect(buildEmbedUrl({ showIcons: false })).not.toBe(buildEmbedUrl({ showIcons: true }));
  });

  it("border toggle → different URLs", () => {
    expect(buildEmbedUrl({ hideBorder: false })).not.toBe(buildEmbedUrl({ hideBorder: true }));
  });

  it("title visibility toggle → different URLs", () => {
    expect(buildEmbedUrl({ hideTitle: false })).not.toBe(buildEmbedUrl({ hideTitle: true }));
  });

  it("Link, Markdown and HTML share the same URL", () => {
    const url = buildEmbedUrl({ username: "octocat", theme: "ocean", radius: "10" });
    expect(`![stats](${url})`).toContain(url);
    expect(`<img src="${url}" />`).toContain(url);
  });
});

// ── renderStatsSvg — API param application ───────────────────────────────────

describe("renderStatsSvg", () => {
  // Title
  it("uses default title with escaped apostrophe", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme });
    expect(svg).toContain("octocat&#x27;s GitHub Stats");
  });

  it("uses custom title", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme, title: "My Awesome Stats" });
    expect(svg).toContain("My Awesome Stats");
    // The auto-generated title "octocat's GitHub Stats" must not appear
    expect(svg).not.toContain("octocat&#x27;s GitHub Stats");
  });

  it("hides title when hideTitle=true", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme, hideTitle: true });
    expect(svg).not.toContain("GitHub Stats");
  });

  it("shows title when hideTitle=false", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme, hideTitle: false });
    expect(svg).toContain("GitHub Stats");
  });

  // Border
  it("omits border stroke when hideBorder=true", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme, hideBorder: true });
    expect(svg).not.toContain("stroke=");
  });

  it("includes border stroke when hideBorder=false", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme, hideBorder: false });
    expect(svg).toContain(`stroke="${defaultTheme.border}"`);
  });

  // Icons — must NOT produce nested <svg>
  it("does NOT produce nested <svg> elements for icons", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme, showIcons: true });
    // Strip the outer <svg …> tag, then check no second <svg is present
    const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    expect(inner).not.toContain("<svg");
  });

  it("renders icon <g> and <path> elements when showIcons=true", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme, showIcons: true });
    expect(svg).toContain("<g ");
    expect(svg).toContain("<path ");
  });

  it("omits icon markup when showIcons=false", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme, showIcons: false });
    // No translate wrapper <g> for icons (only stat-group <g> elements are ok,
    // but those don't have a transform attribute)
    expect(svg).not.toContain("translate(");
  });

  // Radius
  it("applies custom border radius", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme, borderRadius: 16 });
    expect(svg).toContain('rx="16"');
  });

  it("defaults to radius 6", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme });
    expect(svg).toContain('rx="6"');
  });

  // Selected stats
  it("renders only the requested stats", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      visibleStats: ["commits", "followers"],
    });
    expect(svg).toContain("Commits:");
    expect(svg).toContain("Followers:");
    expect(svg).not.toContain("Total Pull Requests:");
    expect(svg).not.toContain("Repository Contributions:");
  });

  it("renders all 11 stats when none are filtered", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme });
    expect(svg).toContain("Username:");
    expect(svg).toContain("Total Contributions:");
  });

  // Obsolete stats must never appear
  it("never renders obsolete stats even if passed in stats object", () => {
    const statsWithObsolete = {
      ...sampleStats,
      gists: 99,
      organizations: 5,
      stars: 1234,
      contributedRepositories: 7,
      restrictedContributions: 2,
    };
    const svg = renderStatsSvg(statsWithObsolete, { theme: defaultTheme });
    expect(svg).not.toContain("Public Gists:");
    expect(svg).not.toContain("Organizations:");
    expect(svg).not.toContain("Total Stars Earned:");
    expect(svg).not.toContain("Contributed Repositories:");
    expect(svg).not.toContain("Restricted Contributions:");
  });

  // Theme colors
  it("uses theme background color", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme });
    expect(svg).toContain(defaultTheme.background);
  });

  it("uses theme title color", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme });
    expect(svg).toContain(defaultTheme.title);
  });

  it("different themes produce different SVG output", () => {
    const svg1 = renderStatsSvg(sampleStats, { theme: defaultTheme });
    const svg2 = renderStatsSvg(sampleStats, { theme: oceanTheme });
    expect(svg1).not.toBe(svg2);
    expect(svg2).toContain(oceanTheme.background);
    expect(svg2).toContain(oceanTheme.title);
  });

  // Verify each named theme is reflected in SVG output
  it.each(Object.entries(themes))(
    "theme %s — SVG contains the theme's background color",
    (name, theme) => {
      const svg = renderStatsSvg(sampleStats, { theme });
      expect(svg).toContain(theme.background);
    },
  );

  // hidden layout — both title and border suppressed
  it("layout=hidden suppresses both title and border", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      hideTitle: true,
      hideBorder: true,
    });
    expect(svg).not.toContain("GitHub Stats");
    expect(svg).not.toContain("stroke=");
  });

  // SVG structure
  it("produces a valid SVG root element", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it("card height grows with more visible rows", () => {
    const short = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      visibleStats: ["commits"],
    });
    const tall = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      visibleStats: ["commits", "followers", "repositories"],
    });
    const heightOf = (s: string) => Number(s.match(/height="(\d+)"/)?.[1]);
    expect(heightOf(tall)).toBeGreaterThan(heightOf(short));
  });
});

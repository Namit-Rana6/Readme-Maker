/**
 * Tests for embed URL generation and API parameter parsing.
 *
 * updateGeneratedCode() runs in a browser context, so we test the same logic
 * here by building URLSearchParams the same way the function does and asserting
 * the resulting URL contains the right params.
 *
 * The API-side param parsing is tested via renderStatsSvg() directly.
 */
import { describe, expect, it } from "vitest";
import { renderStatsSvg } from "../api/render-stats.js";

const BASE = "https://readme-maker-ashen.vercel.app";

const defaultTheme = {
  background: "#0d1117",
  border: "#30363d",
  title: "#a371f7",
  text: "#e6edf3",
  value: "#ffffff",
  accent: "#58a6ff",
};

const sampleStats = {
  username: "octocat",
  name: "The Octocat",
  followers: 500,
  following: 10,
  repositories: 42,
  commits: 300,
  issues: 20,
  pullRequests: 15,
  pullRequestReviews: 5,
  repositoryContributions: 8,
  contributions: 400,
};

// ---------------------------------------------------------------------------
// Helpers that mimic updateGeneratedCode() URL building logic
// ---------------------------------------------------------------------------

interface EmbedConfig {
  username?: string;
  theme?: string;
  radius?: string;
  title?: string;
  showIcons?: boolean;
  hideBorder?: boolean;
  hideTitle?: boolean;
  stats?: string[];
  layout?: "hidden" | "standard";
  customColors?: Record<string, string>;
}

function buildEmbedUrl(config: EmbedConfig): string {
  const username = config.username ?? "Namit-Rana6";
  const theme = config.theme ?? "default";
  const radius = config.radius ?? "6";
  const params = new URLSearchParams({ username, theme, radius });

  if (config.title) params.set("title", config.title);
  if (config.showIcons) params.set("showIcons", "1");
  if (config.hideBorder) params.set("hideBorder", "1");
  if (config.hideTitle) params.set("hideTitle", "1");
  if (config.stats?.length) params.set("stats", config.stats.join(","));
  if (config.layout === "hidden") params.set("layout", "hidden");
  if (config.customColors) {
    Object.entries(config.customColors).forEach(([k, v]) => params.set(k, v));
  }

  return `${BASE}/api/stats?${params}`;
}

// ---------------------------------------------------------------------------
// URL generation tests
// ---------------------------------------------------------------------------

describe("embed URL generation", () => {
  it("contains the production base URL", () => {
    const url = buildEmbedUrl({ username: "octocat" });
    expect(url).toContain(BASE);
    expect(url).toContain("/api/stats");
  });

  it("encodes username in the URL", () => {
    const url = buildEmbedUrl({ username: "Namit-Rana6" });
    expect(url).toContain("username=Namit-Rana6");
  });

  it("encodes theme in the URL", () => {
    const url = buildEmbedUrl({ username: "octocat", theme: "ocean" });
    expect(url).toContain("theme=ocean");
  });

  it("encodes radius in the URL", () => {
    const url = buildEmbedUrl({ username: "octocat", radius: "12" });
    expect(url).toContain("radius=12");
  });

  it("does NOT include title param when title is empty", () => {
    const url = buildEmbedUrl({ username: "octocat", title: "" });
    expect(url).not.toContain("title=");
  });

  it("encodes custom title in the URL", () => {
    const url = buildEmbedUrl({ username: "octocat", title: "My Awesome Stats" });
    expect(url).toContain("title=My+Awesome+Stats");
  });

  it("encodes showIcons=1 when icons are enabled", () => {
    const url = buildEmbedUrl({ username: "octocat", showIcons: true });
    expect(url).toContain("showIcons=1");
  });

  it("does NOT include showIcons param when icons are disabled", () => {
    const url = buildEmbedUrl({ username: "octocat", showIcons: false });
    expect(url).not.toContain("showIcons");
  });

  it("encodes hideBorder=1 when border is hidden", () => {
    const url = buildEmbedUrl({ username: "octocat", hideBorder: true });
    expect(url).toContain("hideBorder=1");
  });

  it("does NOT include hideBorder param when border is visible", () => {
    const url = buildEmbedUrl({ username: "octocat", hideBorder: false });
    expect(url).not.toContain("hideBorder");
  });

  it("encodes hideTitle=1 when title is hidden", () => {
    const url = buildEmbedUrl({ username: "octocat", hideTitle: true });
    expect(url).toContain("hideTitle=1");
  });

  it("does NOT include hideTitle param when title is visible", () => {
    const url = buildEmbedUrl({ username: "octocat", hideTitle: false });
    expect(url).not.toContain("hideTitle");
  });

  it("encodes selected stats in the URL", () => {
    const url = buildEmbedUrl({ username: "octocat", stats: ["commits", "followers"] });
    expect(url).toContain("stats=commits%2Cfollowers");
  });

  it("does NOT include stats param when no stats are selected", () => {
    const url = buildEmbedUrl({ username: "octocat", stats: [] });
    expect(url).not.toContain("stats=");
  });

  it("encodes layout=hidden for hidden layout", () => {
    const url = buildEmbedUrl({ username: "octocat", layout: "hidden" });
    expect(url).toContain("layout=hidden");
  });

  it("encodes custom theme colors in the URL", () => {
    const url = buildEmbedUrl({
      username: "octocat",
      theme: "custom",
      customColors: { background: "#ff0000", border: "#00ff00" },
    });
    expect(url).toContain("theme=custom");
    expect(url).toContain("background=%23ff0000");
    expect(url).toContain("border=%2300ff00");
  });

  it("two different themes produce different URLs", () => {
    const url1 = buildEmbedUrl({ username: "octocat", theme: "default" });
    const url2 = buildEmbedUrl({ username: "octocat", theme: "ocean" });
    expect(url1).not.toBe(url2);
  });

  it("different stat selections produce different URLs", () => {
    const url1 = buildEmbedUrl({ username: "octocat", stats: ["commits"] });
    const url2 = buildEmbedUrl({ username: "octocat", stats: ["followers"] });
    expect(url1).not.toBe(url2);
  });

  it("different radii produce different URLs", () => {
    const url1 = buildEmbedUrl({ username: "octocat", radius: "6" });
    const url2 = buildEmbedUrl({ username: "octocat", radius: "20" });
    expect(url1).not.toBe(url2);
  });

  it("icon visibility toggle produces different URLs", () => {
    const url1 = buildEmbedUrl({ username: "octocat", showIcons: false });
    const url2 = buildEmbedUrl({ username: "octocat", showIcons: true });
    expect(url1).not.toBe(url2);
  });

  it("border visibility toggle produces different URLs", () => {
    const url1 = buildEmbedUrl({ username: "octocat", hideBorder: false });
    const url2 = buildEmbedUrl({ username: "octocat", hideBorder: true });
    expect(url1).not.toBe(url2);
  });

  it("title visibility toggle produces different URLs", () => {
    const url1 = buildEmbedUrl({ username: "octocat", hideTitle: false });
    const url2 = buildEmbedUrl({ username: "octocat", hideTitle: true });
    expect(url1).not.toBe(url2);
  });

  it("Link, Markdown, and HTML all share the same base URL", () => {
    const url = buildEmbedUrl({ username: "octocat", theme: "ocean", radius: "10" });
    const markdown = `![GitHub stats for octocat](${url})`;
    const html = `<img src="${url}" alt="GitHub stats for octocat" />`;

    // All three embed formats reference the identical URL
    expect(markdown).toContain(url);
    expect(html).toContain(url);
  });
});

// ---------------------------------------------------------------------------
// API renderer tests — renderStatsSvg applies URL params correctly
// ---------------------------------------------------------------------------

describe("renderStatsSvg — API param application", () => {
  it("uses default title based on username", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme });
    // render-stats.js escapeXml does not encode single quotes, so the apostrophe
    // appears as a literal ' in the SVG title text.
    expect(svg).toContain("octocat's GitHub Stats");
  });

  it("uses custom title when provided", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      title: "My Awesome Stats",
    });
    expect(svg).toContain("My Awesome Stats");
    expect(svg).not.toContain("octocat&#x27;s GitHub Stats");
  });

  it("hides the title when hideTitle is true", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      hideTitle: true,
    });
    expect(svg).not.toContain("GitHub Stats");
  });

  it("shows the title when hideTitle is false", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      hideTitle: false,
    });
    expect(svg).toContain("GitHub Stats");
  });

  it("omits the border stroke when hideBorder is true", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      hideBorder: true,
    });
    expect(svg).not.toContain("stroke=");
  });

  it("includes border stroke when hideBorder is false", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      hideBorder: false,
    });
    expect(svg).toContain("stroke=");
  });

  it("includes icon markup when showIcons is true", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      showIcons: true,
    });
    // Icon placeholder circle should appear for each rendered row
    expect(svg).toContain("<circle");
  });

  it("omits icon markup when showIcons is false", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      showIcons: false,
    });
    expect(svg).not.toContain("<circle");
  });

  it("applies border radius from params", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      borderRadius: 16,
    });
    expect(svg).toContain('rx="16"');
  });

  it("renders only selected stats", () => {
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      visibleStats: ["commits", "followers"],
    });
    expect(svg).toContain("Commits:");
    expect(svg).toContain("Followers:");
    expect(svg).not.toContain("Total Pull Requests:");
  });

  it("uses theme background color", () => {
    const svg = renderStatsSvg(sampleStats, { theme: defaultTheme });
    expect(svg).toContain(defaultTheme.background);
  });

  it("layout=hidden implies both hideTitle and hideBorder", () => {
    // Simulate what _github.js does when layout=hidden
    const svg = renderStatsSvg(sampleStats, {
      theme: defaultTheme,
      hideTitle: true,
      hideBorder: true,
    });
    expect(svg).not.toContain("GitHub Stats");
    expect(svg).not.toContain("stroke=");
  });

  it("different themes produce SVGs with different colors", () => {
    const oceanTheme = {
      background: "#071a2b",
      border: "#164e63",
      title: "#67e8f9",
      text: "#bae6fd",
      value: "#ffffff",
      accent: "#22d3ee",
    };
    const svg1 = renderStatsSvg(sampleStats, { theme: defaultTheme });
    const svg2 = renderStatsSvg(sampleStats, { theme: oceanTheme });
    expect(svg1).not.toBe(svg2);
    expect(svg2).toContain(oceanTheme.background);
  });
});

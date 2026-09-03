import { fetchGitHubStatsRuntime } from "../src/data/github/runtime.js";
import { renderStatsSvg } from "./render-stats.js";

const statKeys = new Set([
  "username", "name", "followers", "following", "gists", "organizations",
  "repositories", "stars", "contributedRepositories", "commits", "issues",
  "pullRequests", "pullRequestReviews", "repositoryContributions",
  "restrictedContributions", "contributions", "codingHours",
]);
const colorKeys = ["background", "border", "title", "text", "value", "accent"];

function getTheme(url) {
  const hasCustomTheme = colorKeys.every((key) => url.searchParams.has(key));
  if (!hasCustomTheme) {
    const themes = {
      default: { background: "#0d1117", border: "#30363d", title: "#a371f7", text: "#e6edf3", value: "#ffffff", accent: "#58a6ff" },
      dark: { background: "#000000", border: "#333333", title: "#ffffff", text: "#cccccc", value: "#ffffff", accent: "#ffffff" },
      ocean: { background: "#071a2b", border: "#164e63", title: "#67e8f9", text: "#bae6fd", value: "#ffffff", accent: "#22d3ee" },
      sunset: { background: "#1a1917", border: "#5c3328", title: "#ff7c61", text: "#e6ded7", value: "#fffaf5", accent: "#8ee0c0" },
    };
    return themes[url.searchParams.get("theme")] ?? themes.default;
  }

  return Object.fromEntries(colorKeys.map((key) => [key, url.searchParams.get(key)]));
}

export async function handleStatsRequest(req, res, svg = false) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const url = new URL(req.url ?? "/", `https://${req.headers.host ?? "localhost"}`);
  const username = url.searchParams.get("username")?.trim();
  const token = process.env.GITHUB_TOKEN;

  if (!username) {
    res.status(400).json({ error: "username is required" });
    return;
  }

  if (!token) {
    res.status(500).json({ error: "Missing GITHUB_TOKEN on the server." });
    return;
  }

  try {
    const stats = await fetchGitHubStatsRuntime(username, token);
    const theme = getTheme(url);

    if (svg) {
      const requestedStats = url.searchParams.get("stats")?.split(",") ?? [];
      const visibleStats = requestedStats.filter((key) => statKeys.has(key));
      const svgMarkup = renderStatsSvg(stats, {
        theme,
        title: url.searchParams.get("title") ?? undefined,
        borderRadius: Number(url.searchParams.get("radius") ?? 6),
        showIcons: url.searchParams.get("showIcons") === "1",
        hideBorder:
          url.searchParams.get("hideBorder") === "1" ||
          url.searchParams.get("layout") === "hidden",
        hideTitle:
          url.searchParams.get("hideTitle") === "1" ||
          url.searchParams.get("layout") === "hidden",
        visibleStats: visibleStats.length ? visibleStats : undefined,
      });
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.status(200).send(svgMarkup);
      return;
    }

    res.status(200).json({
      ...stats,
      theme: url.searchParams.get("theme") ?? "default",
      themeColors: theme,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
}

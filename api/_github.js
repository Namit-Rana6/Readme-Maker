import { fetchGitHubStats } from "../src/data/github/client.ts";
import { resolveTheme } from "../src/core/theme.ts";
import { GitHubStatsWidget } from "../src/widgets/github-stats/github-stats.ts";

const statKeys = new Set([
  "username", "name", "followers", "following", "gists", "organizations",
  "repositories", "stars", "contributedRepositories", "commits", "issues",
  "pullRequests", "pullRequestReviews", "repositoryContributions",
  "restrictedContributions", "contributions", "codingHours",
]);
const colorKeys = ["background", "border", "title", "text", "value", "accent"];

function getTheme(url) {
  const hasCustomTheme = colorKeys.every((key) => url.searchParams.has(key));
  if (!hasCustomTheme) return resolveTheme(url.searchParams.get("theme") ?? "default");

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
    const stats = await fetchGitHubStats(username, token);
    const theme = getTheme(url);

    if (svg) {
      const requestedStats = url.searchParams.get("stats")?.split(",") ?? [];
      const visibleStats = requestedStats.filter((key) => statKeys.has(key));
      const widget = new GitHubStatsWidget({
        theme,
        borderRadius: Number(url.searchParams.get("radius") ?? 6),
        hideTitle: url.searchParams.get("layout") === "hidden",
        hideBorder: url.searchParams.get("layout") === "hidden",
        visibleStats: visibleStats.length ? visibleStats : undefined,
      });
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.status(200).send(widget.render(stats));
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

import http from "node:http";
import { fetchGitHubStats } from "./src/data/github/client.ts";
import { resolveTheme } from "./src/core/theme.ts";
import { GitHubStatsWidget } from "./src/widgets/github-stats/github-stats.ts";

const PORT = Number(process.env.PORT || 3001);
const statKeys = new Set([
  "username", "name", "followers", "following", "gists", "organizations",
  "repositories", "stars", "contributedRepositories", "commits", "issues",
  "pullRequests", "pullRequestReviews", "repositoryContributions",
  "restrictedContributions", "contributions", "codingHours",
]);

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname !== "/api/github/stats" && url.pathname !== "/api/stats") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const username = url.searchParams.get("username")?.trim();
  const themeName = url.searchParams.get("theme") ?? "default";
  const customKeys = ["background", "border", "title", "text", "value", "accent"];
  const hasCustomTheme = customKeys.every((key) => url.searchParams.has(key));
  const theme = hasCustomTheme
    ? customKeys.reduce((customTheme, key) => {
        customTheme[key] = url.searchParams.get(key) ?? "";
        return customTheme;
      }, {})
    : resolveTheme(themeName);
  const token = process.env.GITHUB_TOKEN;

  if (!username) {
    sendJson(res, 400, {
      error: "username is required",
    });
    return;
  }

  if (!token) {
    sendJson(res, 500, {
      error:
        "Missing GITHUB_TOKEN on the server. Add it to .env or your environment.",
    });
    return;
  }

  try {
    const stats = await fetchGitHubStats(username, token);

    if (url.pathname === "/api/stats") {
      const requestedStats = url.searchParams.get("stats")?.split(",") ?? [];
      const visibleStats = requestedStats.filter((key) => statKeys.has(key));
      const widget = new GitHubStatsWidget({
        theme,
        borderRadius: Number(url.searchParams.get("radius") ?? 6),
        hideTitle: url.searchParams.get("layout") === "hidden",
        hideBorder: url.searchParams.get("layout") === "hidden",
        visibleStats: visibleStats.length ? visibleStats : undefined,
      });
      res.writeHead(200, {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      });
      res.end(widget.render(stats));
      return;
    }

    sendJson(res, 200, { ...stats, theme: themeName, themeColors: theme });
  } catch (error) {
    sendJson(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : "Unexpected server error",
    });
  }
});

server.listen(PORT, () => {
  console.log(
    `GitHub stats backend running on http://localhost:${PORT}`,
  );
});
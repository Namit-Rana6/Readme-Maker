import http from "node:http";
import { fetchGitHubStats } from "./src/data/github/client.ts";
import { resolveTheme } from "./src/core/theme.ts";
import { renderStatsSvg, renderGridSvg } from "./api/render-stats.js";

const PORT = Number(process.env.PORT || 3001);

const STAT_KEYS = new Set([
  "username", "name", "followers", "following", "repositories",
  "commits", "issues", "pullRequests", "pullRequestReviews",
  "repositoryContributions", "contributions",
]);

const COLOR_KEYS = ["background", "border", "title", "text", "value", "accent"];

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

  const username  = url.searchParams.get("username")?.trim();
  const themeName = url.searchParams.get("theme") ?? "default";
  const token     = process.env.GITHUB_TOKEN;

  if (!username) {
    sendJson(res, 400, { error: "username is required" });
    return;
  }

  if (!token) {
    sendJson(res, 500, {
      error: "Missing GITHUB_TOKEN on the server. Add it to .env or your environment.",
    });
    return;
  }

  const hasCustomTheme = COLOR_KEYS.every((key) => url.searchParams.has(key));
  const theme = hasCustomTheme
    ? Object.fromEntries(COLOR_KEYS.map((key) => [key, url.searchParams.get(key)]))
    : resolveTheme(themeName);

  try {
    const stats = await fetchGitHubStats(username, token);

    if (url.pathname === "/api/stats") {
      const requestedStats = url.searchParams.get("stats")?.split(",") ?? [];
      const visibleStats   = requestedStats.filter((key) => STAT_KEYS.has(key));
      const isHidden       = url.searchParams.get("layout") === "hidden";

      const options = {
        theme,
        title:        url.searchParams.get("title") ?? undefined,
        borderRadius: Number(url.searchParams.get("radius") ?? 6),
        showIcons:    url.searchParams.get("showIcons") !== "0",
        hideBorder:   url.searchParams.get("hideBorder") === "1",
        hideTitle:    url.searchParams.get("hideTitle")  === "1",
        centreTitle:  url.searchParams.get("centreTitle") === "1",
        visibleStats: visibleStats.length ? visibleStats : undefined,
      };

      const svg = isHidden
        ? renderGridSvg(stats, options)
        : renderStatsSvg(stats, options);

      res.writeHead(200, {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(svg);
      return;
    }

    sendJson(res, 200, { ...stats, theme: themeName, themeColors: theme });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`GitHub stats backend running on http://localhost:${PORT}`);
});

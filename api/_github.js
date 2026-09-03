import { fetchGitHubStatsRuntime } from "../src/data/github/runtime.js";
import { renderStatsSvg } from "./render-stats.js";
import { resolveTheme, COLOR_KEYS } from "../src/core/themes.js";
import { STAT_KEYS } from "../src/widgets/github-stats/stat-definitions.js";

/**
 * Resolve the theme for a request.
 * - If all six color keys are present as query params → custom theme.
 * - Otherwise resolve by name from the shared registry (falls back to default).
 */
function getTheme(url) {
  const hasCustomTheme = COLOR_KEYS.every((key) => url.searchParams.has(key));
  if (hasCustomTheme) {
    return Object.fromEntries(COLOR_KEYS.map((key) => [key, url.searchParams.get(key)]));
  }
  return resolveTheme(url.searchParams.get("theme") ?? undefined);
}

export async function handleStatsRequest(req, res, svg = false) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const url      = new URL(req.url ?? "/", `https://${req.headers.host ?? "localhost"}`);
  const username = url.searchParams.get("username")?.trim();
  const token    = process.env.GITHUB_TOKEN;

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
      // Filter against the canonical 11-stat allowlist
      const visibleStats = requestedStats.filter((key) => STAT_KEYS.has(key));

      const isHiddenLayout = url.searchParams.get("layout") === "hidden";

      const svgMarkup = renderStatsSvg(stats, {
        theme,
        title:        url.searchParams.get("title") ?? undefined,
        borderRadius: Number(url.searchParams.get("radius") ?? 6),
        showIcons:    url.searchParams.get("showIcons") === "1",
        hideBorder:   url.searchParams.get("hideBorder") === "1" || isHiddenLayout,
        hideTitle:    url.searchParams.get("hideTitle") === "1" || isHiddenLayout,
        visibleStats: visibleStats.length ? visibleStats : undefined,
      });

      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.status(200).send(svgMarkup);
      return;
    }

    res.status(200).json({
      ...stats,
      theme:       url.searchParams.get("theme") ?? "default",
      themeColors: theme,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
}

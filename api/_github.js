import { fetchGitHubStatsRuntime } from "../src/data/github/runtime.js";
import { renderStatsSvg, renderGridSvg } from "./render-stats.js";
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
      const requestedStats  = url.searchParams.get("stats")?.split(",") ?? [];
      const visibleStats    = requestedStats.filter((key) => STAT_KEYS.has(key));
      const isHiddenLayout  = url.searchParams.get("layout") === "hidden";
      const showIcons       = url.searchParams.get("showIcons") !== "0"; // default on
      const hideBorder      = url.searchParams.get("hideBorder") === "1";
      const hideTitle       = url.searchParams.get("hideTitle")  === "1";
      const centreTitle     = url.searchParams.get("centreTitle") === "1";
      const borderRadius    = Number(url.searchParams.get("radius") ?? 6);
      const title           = url.searchParams.get("title") ?? undefined;

      const sharedOptions = {
        theme,
        title,
        borderRadius,
        showIcons,
        hideBorder,
        hideTitle,
        centreTitle,
        visibleStats: visibleStats.length ? visibleStats : undefined,
      };

      const svgMarkup = isHiddenLayout
        ? renderGridSvg(stats, sharedOptions)
        : renderStatsSvg(stats, sharedOptions);

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

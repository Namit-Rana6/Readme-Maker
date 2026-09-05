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
    const message = error instanceof Error ? error.message : "Unexpected server error";
    if (svg) {
      // Return an error SVG so GitHub README embeds show something readable
      // rather than a broken image icon.
      const truncated = message.length > 80 ? message.slice(0, 77) + "…" : message;
      const escaped = truncated.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const errorSvg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="80" viewBox="0 0 500 80">` +
        `<rect width="500" height="80" rx="6" fill="#0d1117" stroke="#f85149" stroke-width="1.5"/>` +
        `<text x="20" y="28" font-size="13" font-weight="700" fill="#f85149">Error</text>` +
        `<text x="20" y="52" font-size="12" fill="#e6edf3">${escaped}</text>` +
        `</svg>`;
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.status(200).send(errorSvg);
      return;
    }
    res.status(500).json({ error: message });
  }
}

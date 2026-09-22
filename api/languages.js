/**
 * Vercel serverless route: /api/languages
 * Renders an SVG top-languages card for a given GitHub username.
 */
import { fetchGitHubStatsRuntime } from "../src/data/github/runtime.js";
import { resolveTheme, COLOR_KEYS } from "../src/core/themes.js";
import { renderLanguagesSvg } from "./render-languages.js";

export default async function handler(req, res) {
  const url      = new URL(req.url ?? "/", "http://localhost");
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

  const hasCustomTheme = COLOR_KEYS.every((key) => url.searchParams.has(key));
  const theme = hasCustomTheme
    ? Object.fromEntries(COLOR_KEYS.map((key) => [key, url.searchParams.get(key)]))
    : resolveTheme(url.searchParams.get("theme") ?? "default");

  const options = {
    theme,
    layout:          url.searchParams.get("layout") ?? "bar",
    maxLanguages:    Number(url.searchParams.get("max") ?? 8),
    borderRadius:    Number(url.searchParams.get("radius") ?? 6),
    hideTitle:       url.searchParams.get("hideTitle")   === "1",
    hideBorder:      url.searchParams.get("hideBorder")  === "1",
    centreTitle:     url.searchParams.get("centreTitle") === "1",
    title:           url.searchParams.get("title") ?? undefined,
  };

  try {
    const stats = await fetchGitHubStatsRuntime(username, token);
    const svg   = renderLanguagesSvg(stats, options);

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(svg);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const truncated = message.length > 80 ? message.slice(0, 77) + "…" : message;
    const escaped   = truncated
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const errorSvg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="80" viewBox="0 0 500 80">` +
      `<rect width="500" height="80" rx="6" fill="#0d1117" stroke="#f85149" stroke-width="1.5"/>` +
      `<text x="20" y="28" font-size="13" font-weight="700" fill="#f85149">Error</text>` +
      `<text x="20" y="52" font-size="12" fill="#e6edf3">${escaped}</text>` +
      `</svg>`;
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(errorSvg);
  }
}

import http from "node:http";
import { readFileSync } from "node:fs";

// Load .env manually if GITHUB_TOKEN isn't already in the environment.
// This covers running `node server.js` directly without --env-file.
if (!process.env.GITHUB_TOKEN) {
  try {
    const envContents = readFileSync(new URL("./.env", import.meta.url), "utf8");
    for (const line of envContents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key   = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env not present — rely on actual environment variables
  }
}

import { fetchGitHubStats } from "./src/data/github/client.ts";
import { resolveTheme, COLOR_KEYS } from "./src/core/themes.js";
import { STAT_KEYS } from "./src/widgets/github-stats/stat-definitions.js";
import { renderStatsSvg, renderGridSvg } from "./api/render-stats.js";
import { renderLanguagesSvg } from "./api/render-languages.js";
import socialCardHandler from "./api/social-card.js";

const PORT = Number(process.env.PORT || 3001);

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

  // Social links card — no token needed
  if (url.pathname === "/api/social-card") {
    // Adapt Node http req/res to the Vercel-style handler
    const vercelRes = {
      _headers: {},
      _status: 200,
      _body: "",
      setHeader(k, v) { this._headers[k] = v; },
      status(code) { this._status = code; return this; },
      send(body) {
        res.writeHead(this._status, this._headers);
        res.end(body);
      },
      end() { res.writeHead(this._status, this._headers); res.end(); },
    };
    await socialCardHandler(req, vercelRes);
    return;
  }

  // Top languages card
  if (url.pathname === "/api/languages") {
    const langUsername = url.searchParams.get("username")?.trim();
    const langToken    = process.env.GITHUB_TOKEN;

    if (!langUsername) { sendJson(res, 400, { error: "username is required" }); return; }
    if (!langToken)    { sendJson(res, 500, { error: "Missing GITHUB_TOKEN on the server." }); return; }

    const hasCustomTheme = COLOR_KEYS.every((key) => url.searchParams.has(key));
    const langTheme = hasCustomTheme
      ? Object.fromEntries(COLOR_KEYS.map((key) => [key, url.searchParams.get(key)]))
      : resolveTheme(url.searchParams.get("theme") ?? "default");

    const langOptions = {
      theme:        langTheme,
      layout:       url.searchParams.get("layout") ?? "bar",
      maxLanguages: Number(url.searchParams.get("max") ?? 8),
      borderRadius: Number(url.searchParams.get("radius") ?? 6),
      hideTitle:    url.searchParams.get("hideTitle")   === "1",
      hideBorder:   url.searchParams.get("hideBorder")  === "1",
      centreTitle:  url.searchParams.get("centreTitle") === "1",
      title:        url.searchParams.get("title") ?? undefined,
    };

    try {
      const { fetchGitHubStatsRuntime } = await import("./src/data/github/runtime.js");
      const stats = await fetchGitHubStatsRuntime(langUsername, langToken);
      const svg   = renderLanguagesSvg(stats, langOptions);
      res.writeHead(200, { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" });
      res.end(svg);
    } catch (error) {
      const message   = error instanceof Error ? error.message : "Unexpected error";
      const truncated = message.length > 80 ? message.slice(0, 77) + "…" : message;
      const escaped   = truncated.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const errorSvg  =
        `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="80" viewBox="0 0 500 80">` +
        `<rect width="500" height="80" rx="6" fill="#0d1117" stroke="#f85149" stroke-width="1.5"/>` +
        `<text x="20" y="28" font-size="13" font-weight="700" fill="#f85149">Error</text>` +
        `<text x="20" y="52" font-size="12" fill="#e6edf3">${escaped}</text>` +
        `</svg>`;
      res.writeHead(200, { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
      res.end(errorSvg);
    }
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
    const message = error instanceof Error ? error.message : "Unexpected server error";
    if (url.pathname === "/api/stats") {
      const truncated = message.length > 80 ? message.slice(0, 77) + "…" : message;
      const escaped = truncated.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const errorSvg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="80" viewBox="0 0 500 80">` +
        `<rect width="500" height="80" rx="6" fill="#0d1117" stroke="#f85149" stroke-width="1.5"/>` +
        `<text x="20" y="28" font-size="13" font-weight="700" fill="#f85149">Error</text>` +
        `<text x="20" y="52" font-size="12" fill="#e6edf3">${escaped}</text>` +
        `</svg>`;
      res.writeHead(200, { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" });
      res.end(errorSvg);
      return;
    }
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`GitHub stats backend running on http://localhost:${PORT}`);
});

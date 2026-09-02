import http from "node:http";
import { fetchGitHubStats } from "./src/data/github/client.ts";
import { resolveTheme } from "./src/core/theme.ts";

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

  if (url.pathname !== "/api/github/stats") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const username = url.searchParams.get("username")?.trim();
  const themeName = url.searchParams.get("theme") ?? "default";
  const theme = resolveTheme(themeName);
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
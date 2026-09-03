# Readme Maker

Generate GitHub stats cards for your profile README in seconds. Enter a username, pick a theme, choose your stats, and copy a single Markdown line.

**Live:** [readme-maker-ashen.vercel.app](https://readme-maker-ashen.vercel.app)

---

## Preview

![GitHub Stats for Namit-Rana6](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=default&radius=6)

---

## Features

- **Stats Card** — selectable metrics rendered as a clean SVG
- **9 built-in themes** — Default, Dark, Ocean, Sunset, Cyberpunk, Midnight, Tokyo Night, Emerald, Sunset Glow
- **Custom theme** — pick any six hex colors directly in the builder
- **Full option parity** — custom title, border radius, show/hide icons, hide border, hide title, hidden compact layout
- **Single URL contract** — the generated Link, Markdown, and HTML all point to the same `/api/stats` endpoint with the exact same parameters shown in the live preview
- **Vercel serverless** — frontend and API deploy together, no separate backend needed
- **Public REST fallback** — profile data loads even without a valid token
- **67 automated tests** with Vitest

---

## Supported Stats

| Key | Label |
|---|---|
| `username` | Username |
| `name` | Name |
| `followers` | Followers |
| `following` | Following |
| `repositories` | Public Repositories |
| `commits` | Commits |
| `issues` | Total Issues |
| `pullRequests` | Total Pull Requests |
| `pullRequestReviews` | Total PR Reviews |
| `repositoryContributions` | Repository Contributions |
| `contributions` | Total Contributions |

---

## Embed URL

All three output formats — Link, Markdown, HTML — use this URL shape:

```
https://readme-maker-ashen.vercel.app/api/stats?<params>
```

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `username` | string | — | GitHub login (**required**) |
| `theme` | string | `default` | Preset theme name |
| `radius` | number | `6` | SVG border radius |
| `title` | string | `{username}'s GitHub Stats` | Custom card title |
| `stats` | comma-separated keys | all | Which stats to show |
| `showIcons` | `1` | off | Show row icons |
| `hideBorder` | `1` | off | Remove the card border |
| `hideTitle` | `1` | off | Remove the card title |
| `layout` | `hidden` | — | Shorthand for hideBorder + hideTitle |
| `background` `border` `title` `text` `value` `accent` | hex | — | Custom theme colors (all six required) |

### Example

```md
![GitHub Stats](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=ocean&radius=8&stats=followers,commits,contributions&showIcons=1)
```

---

## Themes

| Name | Preview |
|---|---|
| `default` | ![default](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=default&stats=commits,contributions&hideTitle=1&radius=6) |
| `ocean` | ![ocean](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=ocean&stats=commits,contributions&hideTitle=1&radius=6) |
| `sunset` | ![sunset](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=sunset&stats=commits,contributions&hideTitle=1&radius=6) |
| `cyberpunk` | ![cyberpunk](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=cyberpunk&stats=commits,contributions&hideTitle=1&radius=6) |
| `midnight` | ![midnight](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=midnight&stats=commits,contributions&hideTitle=1&radius=6) |
| `tokyoNight` | ![tokyoNight](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=tokyoNight&stats=commits,contributions&hideTitle=1&radius=6) |
| `emerald` | ![emerald](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=emerald&stats=commits,contributions&hideTitle=1&radius=6) |
| `sunsetGlow` | ![sunsetGlow](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=sunsetGlow&stats=commits,contributions&hideTitle=1&radius=6) |
| `dark` | ![dark](https://readme-maker-ashen.vercel.app/api/stats?username=Namit-Rana6&theme=dark&stats=commits,contributions&hideTitle=1&radius=6) |

---

## Tech Stack

| Concern | Tool |
|---|---|
| Language | TypeScript |
| Frontend build | Vite |
| API / backend | Vercel Serverless Functions (Node.js) |
| GitHub data | GraphQL API (authenticated) + REST API (public fallback) |
| Widget output | SVG |
| Tests | Vitest |
| Hosting | Vercel |

---

## Project Structure

```
.
├── index.html                         # Builder UI
├── server.js                          # Local Node dev server
├── api/
│   ├── _github.js                     # Shared request handler
│   ├── render-stats.js                # SVG renderer (server-side)
│   ├── github/stats.js                # JSON stats endpoint
│   └── stats.js                       # SVG stats endpoint
├── src/
│   ├── index.ts                       # Browser entry + live controls
│   ├── core/
│   │   ├── theme.ts                   # TS types, re-exports themes.js
│   │   ├── themes.js                  # Shared theme registry (JS, used by API too)
│   │   ├── icons/
│   │   │   ├── github-icons.js        # Icon paths + getGitHubIcon() (shared)
│   │   │   └── github-icons.ts        # TS re-export of github-icons.js
│   │   └── svg/escape.ts             # XML escape helper
│   ├── data/github/
│   │   ├── client.ts                  # fetch wrappers
│   │   ├── mapper.ts                  # GraphQL response → widget data
│   │   ├── queries.ts                 # GraphQL query string
│   │   ├── runtime.js                 # Node-compatible fetch + mapper
│   │   └── types.ts                   # GitHub response types
│   └── widgets/
│       ├── github-embeds.ts           # Languages / Badge / Sparkline renderers
│       └── github-stats/
│           ├── github-stats.ts        # Stats Card widget (browser)
│           ├── stat-definitions.js    # Canonical 11-stat list (shared)
│           ├── stat-row.ts            # Single stat row renderer
│           └── types.ts               # GitHubStatsData interface
├── tests/
│   ├── embed-url.test.ts              # URL generation + API renderer tests
│   ├── github-stats.test.ts           # Widget unit tests
│   └── github-data-map.test.ts        # Data mapper tests
└── scripts/
    └── load-github-user.mjs           # CLI GitHub lookup helper
```

---

## Local Setup

**Requirements:** Node.js 22+, npm, a GitHub personal access token.

```bash
git clone https://github.com/Namit-Rana6/Readme-Maker.git
cd Readme-Maker
npm install
```

Create `.env` in the project root:

```env
GITHUB_TOKEN=your_github_personal_access_token
```

> Never commit `.env`. Never put the token in frontend code or generated snippets.

Start the local backend:

```bash
npm start
# or: node server.js
```

Start the frontend dev server (proxies `/api` to `localhost:3001`):

```bash
npm run dev
```

Open [http://localhost:4175](http://localhost:4175).

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 4175 |
| `npm start` | Start local Node API server on port 3001 |
| `npm run build` | Build frontend to `dist/` |
| `npm test` | Run the full Vitest test suite |
| `node scripts/load-github-user.mjs <user>` | Test a GitHub GraphQL lookup directly |

---

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the project in [vercel.com](https://vercel.com).
3. Add `GITHUB_TOKEN` in **Project → Settings → Environment Variables**.
4. Deploy — Vercel auto-detects the Vite frontend and the `api/` serverless functions.

No separate backend deploy is needed. `server.js` is only used for local development.

---

## Architecture Notes

### Single source of truth

| Concern | Shared file | Consumers |
|---|---|---|
| Stat definitions | `src/widgets/github-stats/stat-definitions.js` | `github-stats.ts` (browser), `render-stats.js` (API) |
| Theme registry | `src/core/themes.js` | `theme.ts` (browser), `_github.js` (API) |
| Icon paths | `src/core/icons/github-icons.js` | `github-icons.ts` (browser), `render-stats.js` (API) |

### SVG icon rendering

Icons are inlined as `<g>` elements (paths only, no nested `<svg>`). GitHub's Markdown renderer silently drops nested `<svg>` elements, so this approach ensures icons appear identically in the Builder preview and in rendered READMEs.

### URL contract

`updateGeneratedCode()` in `src/index.ts` builds the embed URL from the current UI state. The same parameters are read by `api/_github.js` and passed to `api/render-stats.js`. What you see in the live preview is exactly what gets rendered from the URL.

---

## Theme System

Themes live in `src/core/themes.js` and implement six color slots:

```js
{
  background: string,  // card fill
  border:     string,  // card stroke
  title:      string,  // heading text
  text:       string,  // label text
  value:      string,  // stat value text
  accent:     string,  // icon stroke + highlights
}
```

To add a theme: add one entry to `themes` in `src/core/themes.js`. It automatically appears in the builder dropdown and is available as a URL parameter.

---

## Security

- `GITHUB_TOKEN` is read server-side only and never exposed to the browser.
- User-controlled text (username, title) is XML-escaped before insertion into SVG.
- Use a least-privilege token (read-only public data).
- Set `GITHUB_TOKEN` through your hosting provider's secret management — never hardcode it.
- Add rate limiting and caching before exposing the API at public scale.

---

## Contributing

Contributions are welcome — new themes, new metrics, bug fixes, accessibility improvements, and documentation updates.

### Workflow

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/your-change
   ```
2. Install dependencies: `npm install`
3. Make a focused change and add/update tests.
4. Verify both checks pass:
   ```bash
   npm run build
   npm test
   ```
5. Check the browser flow locally for any UI or output changes.
6. Open a pull request against `main` with a clear description.

### Guidelines

- Keep PRs small and focused on one thing.
- Follow the existing TypeScript + shared-JS architecture.
- Use `STAT_DEFINITIONS` for any new stats — do not add keys only to one side.
- Use `themes.js` for any new themes — do not add them only to the API.
- Escape all user-controlled values before putting them in SVG.
- Do not commit `.env`, `dist/`, `node_modules/`, or tokens.
- Update this README when adding public API parameters.

### PR Checklist

- [ ] Focused, single-purpose change
- [ ] Tests added or updated
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] No secrets or generated files committed
- [ ] README updated if API or setup changed
- [ ] Browser preview checked for UI changes

---

## License

ISC — see `package.json`.

---

[readme-maker-ashen.vercel.app](https://readme-maker-ashen.vercel.app) · [GitHub](https://github.com/Namit-Rana6/Readme-Maker) · [Issues](https://github.com/Namit-Rana6/Readme-Maker/issues)

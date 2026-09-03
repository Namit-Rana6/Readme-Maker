# Readme Maker

Readme Maker is an open-source GitHub widget generator. Enter a GitHub username, choose a widget mode and theme, select the stats you want, and copy a ready-to-use link, Markdown snippet, or HTML embed.

The project is currently in alpha. The codebase is intentionally small and easy to extend with new widget types, themes, GitHub metrics, and output formats.

## Features

- GitHub username lookup through a server-side GitHub GraphQL request
- SVG stats card with selectable metrics
- Theme system shared by every widget renderer
- Preset themes plus custom color palettes
- Border radius, title, border, icon, and layout controls
- Generated link, Markdown, and HTML embed snippets
- Coming-soon states for Languages, Mini Badge, and Sparkline modes
- Responsive browser interface
- Public REST fallback for profile data when the backend is unavailable
- Automated mapper and widget tests with Vitest

## Tech Stack

- TypeScript for browser and data-layer code
- HTML and CSS for the interface
- Vite for local frontend development and production builds
- Node.js HTTP server for the backend API
- GitHub GraphQL API for authenticated stats
- GitHub REST API for the public fallback
- SVG for generated widgets
- Vitest for tests
- npm and Git for project tooling

## Project Structure

```text
.
├── index.html                       # Main generator webpage
├── server.js                        # Node backend and SVG endpoint
├── api/
│   ├── _github.js                   # Shared Vercel API handler
│   ├── github/stats.js              # JSON stats function
│   └── stats.js                     # SVG widget function
├── vite.config.ts                   # Local /api proxy to the Node server
├── src/
│   ├── index.ts                     # Browser entry and live controls
│   ├── core/
│   │   ├── theme.ts                 # Theme contract and theme registry
│   │   ├── icons/                   # Reusable SVG icons
│   │   └── svg/                     # SVG escaping helpers
│   ├── data/github/
│   │   ├── client.ts                # GitHub API client
│   │   ├── mapper.ts                # Raw response to widget data
│   │   ├── queries.ts               # GraphQL query
│   │   └── types.ts                 # GitHub response types
│   └── widgets/
│       ├── github-stats/            # Stats card renderer
│       └── github-embeds.ts         # Additional embed renderers
├── tests/                           # Vitest test suite
└── scripts/                         # Local API verification scripts
```

## Requirements

- Node.js 22 or newer
- npm
- A GitHub personal access token for the server-side GraphQL request

## Local Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/Namit-Rana6/Readme-Maker.git
cd Readme-Maker
npm install
```

Create a local `.env` file in the project root:

```env
GITHUB_TOKEN=your_github_token
```

Never commit `.env` or expose the token in browser code.

Start the backend in one terminal:

```bash
node server.js
```

Start the frontend in another terminal. The Vite proxy forwards `/api` requests to the local backend:

```bash
npx vite --host 0.0.0.0 --port 4175
```

Open [http://localhost:4175/](http://localhost:4175/) in a browser.

The backend health check is available at [http://localhost:3001/health](http://localhost:3001/health). The browser itself uses same-origin `/api/...` paths, so it does not contain a hardcoded production localhost URL.

## Commands

Run the complete test suite:

```bash
npx vitest run
```

Build the frontend:

```bash
npx vite build
```

Verify a GitHub GraphQL lookup directly:

```bash
node scripts/load-github-user.mjs Namit-Rana6
```

## API

### Health check

```text
GET /health
```

Returns:

```json
{"ok":true}
```

### GitHub stats data

```text
GET /api/github/stats?username=Namit-Rana6&theme=ocean
```

The token is read only by the backend from `GITHUB_TOKEN`. The response contains the mapped GitHub stats and the resolved theme metadata.

### SVG widget

```text
GET /api/stats?username=Namit-Rana6&theme=ocean&stats=username,followers,commits&radius=8
```

The SVG endpoint accepts:

- `username`: GitHub login
- `theme`: preset theme name
- `stats`: comma-separated selected stat keys
- `radius`: SVG border radius
- `layout=hidden`: compact hidden layout
- custom theme colors: `background`, `border`, `title`, `text`, `value`, and `accent`

Example Markdown output:

```md
![GitHub Stats](http://localhost:3001/api/stats?username=Namit-Rana6&theme=ocean&stats=username%2Cfollowers%2Ccommits)
```

## Theme System

Themes are defined in [src/core/theme.ts](src/core/theme.ts) and implement six color slots:

```ts
export interface WidgetTheme {
  background: string;
  border: string;
  title: string;
  text: string;
  value: string;
  accent: string;
}
```

To add a preset, add one object to the `themes` registry. The stats card and the other widget renderers receive the resolved theme instead of selecting colors themselves.

## Security

- Keep `GITHUB_TOKEN` on the backend only.
- Do not put the token in `index.html`, `src/index.ts`, generated snippets, or client-side environment variables.
- Use a least-privilege GitHub token appropriate for the data you need.
- Configure environment variables through the hosting provider’s secret settings in production.
- Add rate limiting and request caching before exposing the API publicly at scale.

## Deployment

The frontend and backend are separate runtime concerns:

1. Build the frontend with `npx vite build`.
2. Serve the generated `dist/` directory from a static host or web server.
3. Run `node server.js` on a Node.js service.
4. Set `GITHUB_TOKEN` and `PORT` in the deployment provider’s environment settings.
5. Update the frontend backend URL in `src/index.ts` from the local URL to the deployed backend URL.
6. Configure CORS to allow only the deployed frontend origin instead of `*`.
7. Test `/health`, `/api/github/stats`, and `/api/stats` after deployment.

The current frontend uses same-origin `/api` paths. During local development, `vite.config.ts` proxies those paths to `http://localhost:3001`; on Vercel, the `api/` functions handle them on the same deployment. No production localhost URL or separate backend origin is required.

Vercel detects the Vite frontend and the functions in `api/` automatically. Deploy from the repository, add `GITHUB_TOKEN` in the Vercel project environment variables, and use the production URL for the generated embeds. `server.js` remains available as a local Node development server and is not the production Vercel entrypoint.

## Contributing

Contributions are welcome. This project is in alpha, so improvements, bug fixes, new themes, new metrics, accessibility work, documentation, and new widget ideas are all useful.

### Development workflow

1. Fork the repository.
2. Create a focused branch from `main`:

	```bash
	git checkout -b feat/your-change
	```

3. Install dependencies with `npm install`.
4. Make one focused change at a time.
5. Add or update tests for behavior changes.
6. Run both checks:

	```bash
	npx vite build
	npx vitest run
	```

7. Check the browser flow locally when changing the UI or generated output.
8. Commit with a clear message and open a pull request against `main`.

### Contribution guidelines

- Keep pull requests small and focused.
- Preserve the existing TypeScript, SVG, and theme architecture.
- Do not commit `.env`, tokens, generated `dist/` output, or `node_modules/`.
- Use the shared `WidgetTheme` contract for all new widget colors.
- Escape user-controlled text before inserting it into SVG.
- Keep undefined and zero-value stat behavior intentional and tested.
- Avoid unrelated formatting or dependency changes.
- Update the README when adding public API parameters or setup requirements.
- Include a short explanation of the behavior changed and how it was tested.
- For UI changes, include a screenshot or a clear browser verification note when possible.

### Pull request checklist

- [ ] The change has a clear, focused purpose.
- [ ] Tests were added or updated where needed.
- [ ] `npx vitest run` passes.
- [ ] `npx vite build` passes.
- [ ] No secrets or generated dependencies are included.
- [ ] The README or API documentation is updated when necessary.
- [ ] The browser preview was checked for frontend changes.

## License

This project currently uses the ISC license declared in `package.json`.

## Community

Readme Maker is built in the open. Feature ideas, issue reports, documentation improvements, and code contributions are always welcome at:

https://github.com/Namit-Rana6/Readme-Maker

export type GitHubIconName =
  | "user"
  | "file-description"
  | "users"
  | "user-plus"
  | "book-2"
  | "git-commit"
  | "bug"
  | "git-pull-request"
  | "message-check"
  | "git-merge"
  | "chart-dots"
  | "star"
  | "clock";

export interface GitHubIconOptions {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const buildSvg = (
  paths: string,
  name: string,
  { size = 24, color = "currentColor", strokeWidth = 2 }: GitHubIconOptions = {},
) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-${name}">
    ${paths}
  </svg>
`.trim();

export const githubIcons = {
  user: buildSvg(
    `
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    `,
    "user",
  ),
  "file-description": buildSvg(
    `
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2" />
      <path d="M9 17h6" />
      <path d="M9 13h6" />
    `,
    "file-description",
  ),
  users: buildSvg(
    `
      <path d="M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
    `,
    "users",
  ),
  "user-plus": buildSvg(
    `
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <path d="M16 19h6" />
      <path d="M19 16v6" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4" />
    `,
    "user-plus",
  ),
  "book-2": buildSvg(
    `
      <path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12" />
      <path d="M19 16h-12a2 2 0 0 0 -2 2" />
      <path d="M9 8h6" />
    `,
    "book-2",
  ),
  "git-commit": buildSvg(
    `
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M12 3l0 6" />
      <path d="M12 15l0 6" />
    `,
    "git-commit",
  ),
  bug: buildSvg(
    `
      <path d="M9 9v-1a3 3 0 0 1 6 0v1" />
      <path d="M8 9h8a6 6 0 0 1 1 3v3a5 5 0 0 1 -10 0v-3a6 6 0 0 1 1 -3" />
      <path d="M3 13l4 0" />
      <path d="M17 13l4 0" />
      <path d="M12 20l0 -6" />
      <path d="M4 19l3.35 -2" />
      <path d="M20 19l-3.35 -2" />
      <path d="M4 7l3.75 2.4" />
      <path d="M20 7l-3.75 2.4" />
    `,
    "bug",
  ),
  "git-pull-request": buildSvg(
    `
      <path d="M4 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M4 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M16 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M6 8l0 8" />
      <path d="M11 6h5a2 2 0 0 1 2 2v8" />
      <path d="M14 9l-3 -3l3 -3" />
    `,
    "git-pull-request",
  ),
  "message-check": buildSvg(
    `
      <path d="M8 9h8" />
      <path d="M8 13h6" />
      <path d="M10.99 19.206l-2.99 1.794v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6" />
      <path d="M15 19l2 2l4 -4" />
    `,
    "message-check",
  ),
  "git-merge": buildSvg(
    `
      <path d="M5 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M5 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M15 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M7 8l0 8" />
      <path d="M7 8a4 4 0 0 0 4 4h4" />
    `,
    "git-merge",
  ),
  "chart-dots": buildSvg(
    `
      <path d="M3 3v18h18" />
      <path d="M7 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M17 7a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M12 15a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M10.16 10.62l2.34 2.88" />
      <path d="M15.088 13.328l2.837 -4.586" />
    `,
    "chart-dots",
  ),
  star: buildSvg(
    `
      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
    `,
    "star",
  ),
  clock: buildSvg(
    `
      <path d="M12 7v5l3 3" />
      <path d="M12 21a9 9 0 1 0 0 -18a9 9 0 0 0 0 18" />
    `,
    "clock",
  ),
} satisfies Record<GitHubIconName, string>;

export function getGitHubIcon(
  name: GitHubIconName,
  options: GitHubIconOptions = {},
): string {
  const svg = githubIcons[name];
  if (!svg) return "";

  const { size = 24, color = "currentColor", strokeWidth = 2 } = options;

  return svg
    .replace(/width="\d+"/g, `width="${size}"`)
    .replace(/height="\d+"/g, `height="${size}"`)
    .replace(/<svg([^>]*)stroke="[^"]*"/g, `<svg$1stroke="${color}"`)
    .replace(/stroke-width="\d+"/g, `stroke-width="${strokeWidth}"`);
}

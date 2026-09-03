/**
 * TypeScript wrapper — re-exports everything from the plain-JS module so the
 * frontend and the Vercel API handlers share one implementation.
 */
// @ts-expect-error — plain JS module, no type declarations needed
import { iconPaths, getGitHubIcon as _getGitHubIcon } from "./github-icons.js";

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

export { iconPaths };

export function getGitHubIcon(
  name: GitHubIconName,
  options: GitHubIconOptions = {},
): string {
  return _getGitHubIcon(name, options) as string;
}

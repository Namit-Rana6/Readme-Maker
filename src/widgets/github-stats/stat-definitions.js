/**
 * Canonical 11-stat contract — single source of truth shared by the Vite
 * frontend widget (github-stats.ts) and the Vercel API renderer
 * (api/render-stats.js).
 *
 * Each entry: [statKey, iconName, displayLabel]
 *
 * IMPORTANT: Do not add obsolete keys (gists, organizations, stars,
 * contributedRepositories, restrictedContributions, codingHours).
 * If a new stat is added to the widget it must be added here too.
 */
export const STAT_DEFINITIONS = [
  ["username",                "user",             "Username:"],
  ["name",                    "user",             "Name:"],
  ["followers",               "users",            "Followers:"],
  ["following",               "user-plus",        "Following:"],
  ["repositories",            "book-2",           "Public Repositories:"],
  ["commits",                 "git-commit",       "Commits:"],
  ["issues",                  "bug",              "Total Issues:"],
  ["pullRequests",            "git-pull-request", "Total Pull Requests:"],
  ["pullRequestReviews",      "message-check",    "Total PR Reviews:"],
  ["repositoryContributions", "git-merge",        "Repository Contributions:"],
  ["contributions",           "chart-dots",       "Total Contributions:"],
];

/** Set of valid stat keys — used for allowlist filtering of URL params. */
export const STAT_KEYS = new Set(STAT_DEFINITIONS.map(([key]) => key));

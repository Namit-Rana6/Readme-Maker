import { readFileSync } from "node:fs";

const username = process.argv[2];

if (!username) {
  console.error("Usage: node scripts/load-github-user.mjs <username>");
  process.exit(1);
}

const envPath = new URL("../.env", import.meta.url);
let envText = "";

try {
  envText = readFileSync(envPath, "utf-8");
} catch {
  // no .env file yet
}

const token = envText
  .split(/\r?\n/)
  .find((line) => line.startsWith("GITHUB_TOKEN="))
  ?.split("=")
  .slice(1)
  .join("=")
  ?.trim();

if (!token) {
  console.error("Missing GITHUB_TOKEN in .env");
  process.exit(1);
}

const query = `
  query GetGitHubStats($username: String!) {
    user(login: $username) {
      login
      name
      bio
      followers { totalCount }
      following { totalCount }
      repositories(first: 1) { totalCount }
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        contributionCalendar { totalContributions }
      }
    }
  }
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "Readme-Maker-CLI",
  },
  body: JSON.stringify({ query, variables: { username } }),
});

const payload = await response.json();

if (!response.ok || payload.errors?.length) {
  console.error(payload.errors?.[0]?.message ?? `Request failed: ${response.status}`);
  process.exit(1);
}

console.log(JSON.stringify(payload.data, null, 2));

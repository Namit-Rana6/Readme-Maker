import {
  fetchGitHubStatsRuntime,
  mapGitHubUserResponseToStats,
} from "./runtime.js";
import type {
  GitHubPublicUserResponse,
} from "./types.ts";

export { mapGitHubUserResponseToStats };

export function mapPublicGitHubUserResponseToStats(
  response: GitHubPublicUserResponse,
) {
  return {
    username: response.login,
    name: response.name ?? undefined,
    bio: response.bio ?? undefined,
    followers: response.followers ?? 0,
    following: response.following ?? 0,
    repositories: response.public_repos ?? 0,
    commits: 0,
    issues: 0,
    pullRequests: 0,
    pullRequestReviews: 0,
    repositoryContributions: 0,
    contributions: 0,
  };
}

export async function fetchPublicGitHubUser(username: string) {
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Readme-Maker",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub user lookup failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GitHubPublicUserResponse;
  return mapPublicGitHubUserResponseToStats(data);
}

export async function fetchGitHubStats(
  username: string,
  token: string,
) {
  return fetchGitHubStatsRuntime(username, token);
}
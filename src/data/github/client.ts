import { GITHUB_STATS_QUERY } from "./queries.ts";
import { mapGitHubUserResponseToStats } from "./mapper.ts";
import type {
  GitHubGraphQLError,
  GitHubPublicUserResponse,
  GitHubUserResponse,
} from "./types.ts";

export { mapGitHubUserResponseToStats };

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

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
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "Readme-Maker",
    },
    body: JSON.stringify({
      query: GITHUB_STATS_QUERY,
      variables: {
        username,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const result = (await response.json()) as {
    data?: GitHubUserResponse;
    errors?: GitHubGraphQLError[];
  };

  if (result.errors?.length) {
    throw new Error(
      `GitHub GraphQL error: ${result.errors
        .map((error) => error.message)
        .join(", ")}`,
    );
  }

  if (!result.data) {
    throw new Error("GitHub API returned no data.");
  }

  return mapGitHubUserResponseToStats(result.data);
}
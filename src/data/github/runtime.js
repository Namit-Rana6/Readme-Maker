const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const currentYear = new Date().getFullYear();

export const GITHUB_STATS_QUERY = `
  query GetGitHubStats($username: String!) {
    user(login: $username) {
      login
      name
      bio
      followers { totalCount }
      following { totalCount }
      gists(first: 1) { totalCount }
      organizations(first: 1) { totalCount }
      repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
        totalCount
        nodes {
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
      repositoriesContributedTo(first: 1) { totalCount }
      contributionsCollection(
        from: "${currentYear}-01-01T00:00:00Z"
        to: "${currentYear}-12-31T23:59:59Z"
      ) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount
        contributionCalendar { totalContributions }
      }
    }
  }
`;

export function mapGitHubUserResponseToStats(response) {
  const user = response.user;
  const contributions = user.contributionsCollection ?? {};
  const nodes = user.repositories?.nodes ?? [];

  const stars = nodes.reduce(
    (total, repository) => total + repository.stargazerCount,
    0,
  );

  // Aggregate language byte counts across all repos
  const languageTotals = {};
  for (const repo of nodes) {
    for (const edge of repo.languages?.edges ?? []) {
      const name = edge.node.name;
      if (!languageTotals[name]) {
        languageTotals[name] = { size: 0, color: edge.node.color ?? "#ccc" };
      }
      languageTotals[name].size += edge.size;
    }
  }

  // Sort by size descending and calculate percentages
  const totalBytes = Object.values(languageTotals).reduce((sum, l) => sum + l.size, 0);
  const languages = Object.entries(languageTotals)
    .sort(([, a], [, b]) => b.size - a.size)
    .map(([name, { size, color }]) => ({
      name,
      size,
      color,
      percentage: totalBytes > 0 ? Math.round((size / totalBytes) * 1000) / 10 : 0,
    }));

  return {
    username: user.login,
    name: user.name ?? undefined,
    bio: user.bio ?? undefined,
    followers: user.followers?.totalCount ?? 0,
    following: user.following?.totalCount ?? 0,
    gists: user.gists?.totalCount ?? 0,
    organizations: user.organizations?.totalCount ?? 0,
    repositories: user.repositories?.totalCount ?? 0,
    stars,
    commits: contributions.totalCommitContributions ?? 0,
    issues: contributions.totalIssueContributions ?? 0,
    pullRequests: contributions.totalPullRequestContributions ?? 0,
    pullRequestReviews: contributions.totalPullRequestReviewContributions ?? 0,
    repositoryContributions: contributions.totalRepositoryContributions ?? 0,
    contributedRepositories: user.repositoriesContributedTo?.totalCount ?? 0,
    restrictedContributions: contributions.restrictedContributionsCount ?? 0,
    contributions: contributions.contributionCalendar?.totalContributions ?? 0,
    languages,
  };
}

export async function fetchGitHubStatsRuntime(username, token) {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "Readme-Maker",
    },
    body: JSON.stringify({
      query: GITHUB_STATS_QUERY,
      variables: { username },
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }
  if (result.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${result.errors.map((error) => error.message).join(", ")}`);
  }
  if (!result.data) {
    throw new Error("GitHub API returned no data.");
  }
  if (!result.data.user) {
    throw new Error(`GitHub user not found: "${username}"`);
  }

  return mapGitHubUserResponseToStats(result.data);
}

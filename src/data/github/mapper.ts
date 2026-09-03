import type { GitHubStatsData } from "../../widgets/github-stats/types.ts";
import type { GitHubUserResponse } from "./types.ts";

export function mapGitHubUserResponseToStats(
  response: GitHubUserResponse,
): GitHubStatsData {
  const user = response.user;
  const contributions = user.contributionsCollection;
  const stars = (user.repositories?.nodes ?? []).reduce(
    (total, repository) => total + repository.stargazerCount,
    0,
  );

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

    commits: contributions?.totalCommitContributions ?? 0,
    issues: contributions?.totalIssueContributions ?? 0,
    pullRequests: contributions?.totalPullRequestContributions ?? 0,
    pullRequestReviews:
      contributions?.totalPullRequestReviewContributions ?? 0,
    repositoryContributions:
      contributions?.totalRepositoryContributions ?? 0,
    contributedRepositories:
      user.repositoriesContributedTo?.totalCount ?? 0,
    restrictedContributions: contributions?.restrictedContributionsCount ?? 0,
    contributions:
      contributions?.contributionCalendar?.totalContributions ?? 0,
  };
}
import type { GitHubStatsData } from "../../widgets/github-stats/types";
import type { GitHubUserResponse } from "./types";

export function mapGitHubUserResponseToStats(
  response: GitHubUserResponse,
): GitHubStatsData {
  const user = response.user;
  const contributions = user.contributionsCollection;

  return {
    username: user.login,
    name: user.name ?? undefined,
    bio: user.bio ?? undefined,

    followers: user.followers?.totalCount ?? 0,
    following: user.following?.totalCount ?? 0,
    repositories: user.repositories?.totalCount ?? 0,

    commits: contributions?.totalCommitContributions ?? 0,
    issues: contributions?.totalIssueContributions ?? 0,
    pullRequests: contributions?.totalPullRequestContributions ?? 0,
    pullRequestReviews:
      contributions?.totalPullRequestReviewContributions ?? 0,
    repositoryContributions:
      contributions?.totalRepositoryContributions ?? 0,
    contributions:
      contributions?.contributionCalendar?.totalContributions ?? 0,
  };
}
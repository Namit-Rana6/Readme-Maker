export interface GitHubStatsData {
  username?: string;
  name?: string;
  bio?: string;

  followers?: number;
  following?: number;
  gists?: number;
  organizations?: number;
  repositories?: number;
  contributedRepositories?: number;
  restrictedContributions?: number;

  commits?: number;
  issues?: number;
  pullRequests?: number;
  pullRequestReviews?: number;
  repositoryContributions?: number;
  contributions?: number;
  stars?: number;
  codingHours?: number;
}
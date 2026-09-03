export interface GitHubStatsData {
  username?: string;
  name?: string;
  bio?: string;

  followers?: number;
  following?: number;
  repositories?: number;

  commits?: number;
  issues?: number;
  pullRequests?: number;
  pullRequestReviews?: number;
  repositoryContributions?: number;
  contributions?: number;
}
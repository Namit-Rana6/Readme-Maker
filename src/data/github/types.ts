export interface GitHubPublicUserResponse {
  login: string;
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists?: number;
  type?: string;
  avatar_url?: string;
}

export interface GitHubUserResponse {
  user: {
    login: string;
    name: string | null;
    bio: string | null;

    followers: {
      totalCount: number;
    };

    following: {
      totalCount: number;
    };

    gists?: {
      totalCount: number;
    };

    organizations?: {
      totalCount: number;
    };

    repositories: {
      totalCount: number;
      nodes?: Array<{
        stargazerCount: number;
      }>;
    };

    repositoriesContributedTo?: {
      totalCount: number;
    };

    contributionsCollection: {
      totalCommitContributions: number;
      totalIssueContributions: number;
      totalPullRequestContributions: number;
      totalPullRequestReviewContributions: number;
      totalRepositoryContributions: number;
      restrictedContributionsCount?: number;


      contributionCalendar: {
        totalContributions: number;
      };
    };
  };
}

export interface GitHubGraphQLError {
  message: string;
}
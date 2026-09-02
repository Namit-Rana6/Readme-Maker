const currentYear = new Date().getFullYear();

export const GITHUB_STATS_QUERY = `
  query GetGitHubStats($username: String!) {
    user(login: $username) {
      login
      name
      bio

      followers {
        totalCount
      }

      following {
        totalCount
      }

      gists(first: 1) {
        totalCount
      }

      organizations(first: 1) {
        totalCount
      }

      repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
        totalCount
        nodes {
          stargazerCount
        }
      }

      repositoriesContributedTo(first: 1) {
        totalCount
      }

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

        contributionCalendar {
          totalContributions
        }
      }
    }
  }
`;
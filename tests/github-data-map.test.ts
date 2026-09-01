import { describe, expect, it } from "vitest";
import { mapGitHubUserResponseToStats } from "../src/data/github/client";

describe("mapGitHubUserResponseToStats", () => {
  it("maps the raw GitHub GraphQL payload into widget data", () => {
    const mapped = mapGitHubUserResponseToStats({
      user: {
        login: "octocat",
        name: "The Octocat",
        bio: "Hello, world!",
        followers: { totalCount: 123 },
        following: { totalCount: 45 },
        repositories: { totalCount: 7 },
        contributionsCollection: {
          totalCommitContributions: 90,
          totalIssueContributions: 14,
          totalPullRequestContributions: 11,
          totalPullRequestReviewContributions: 3,
          totalRepositoryContributions: 2,
          contributionCalendar: {
            totalContributions: 120,
          },
        },
      },
    });

    expect(mapped.username).toBe("octocat");
    expect(mapped.name).toBe("The Octocat");
    expect(mapped.bio).toBe("Hello, world!");
    expect(mapped.followers).toBe(123);
    expect(mapped.following).toBe(45);
    expect(mapped.repositories).toBe(7);
    expect(mapped.commits).toBe(90);
    expect(mapped.issues).toBe(14);
    expect(mapped.pullRequests).toBe(11);
    expect(mapped.pullRequestReviews).toBe(3);
    expect(mapped.repositoryContributions).toBe(2);
    expect(mapped.contributions).toBe(120);
  });
});

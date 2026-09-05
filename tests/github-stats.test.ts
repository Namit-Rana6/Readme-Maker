import { describe, expect, it } from "vitest";
import { GitHubStatsWidget } from "../src/widgets/github-stats/github-stats";

describe("GitHubStatsWidget", () => {
  it("renders a valid SVG root", () => {
    const widget = new GitHubStatsWidget();

    const svg = widget.render({
      username: "Namit Rana",
      commits: 87,
      pullRequests: 12,
      issues: 4,
      contributions: 129,
      repositories: 27,
      followers: 100,
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("uses the username as the default title", () => {
    const widget = new GitHubStatsWidget();

    const svg = widget.render({
      username: "Namit Rana",
      commits: 87,
      pullRequests: 12,
      issues: 4,
      contributions: 129,
      repositories: 27,
      followers: 100,
    });

    expect(svg).toContain("Namit Rana&#x27;s GitHub Stats");
  });

  it("shrinks the card when only a few stats are selected", () => {
    const widget = new GitHubStatsWidget({
      visibleStats: ["repositories", "commits"],
    });

    const svg = widget.render({
      username: "Namit Rana",
      commits: 87,
      pullRequests: 12,
      issues: 4,
      codingHours: 63.1,
      contributions: 129,
      repositories: 27,
      followers: 100,
    });

    expect(svg).toContain('height="120"');
    expect(svg).toContain("Public Repositories:");
    expect(svg).toContain("Commits:");
  });

  it("does not render rows whose values are undefined", () => {
    const widget = new GitHubStatsWidget();

    const svg = widget.render({
      username: "Namit Rana",
      commits: 87,
      pullRequests: undefined,
      issues: 4,
      contributions: 129,
      repositories: 27,
      followers: 100,
    } as any);

    expect(svg).toContain("Public Repositories:");
    expect(svg).toContain("Commits:");
    expect(svg).not.toContain("Total Pull Requests:");
    expect(svg).not.toContain("Coding Hours:");
  });

  it("keeps rows inside the card when the title is hidden", () => {
    const widget = new GitHubStatsWidget({ hideTitle: true });

    const svg = widget.render({
      username: "Namit Rana",
      followers: 100,
      repositories: 27,
      commits: 87,
      issues: 4,
      pullRequests: 12,
    });

    expect(svg).toContain('height="160"');
    expect(svg).toContain('y="30"');
    expect(svg).toContain('y="130"');
  });
});
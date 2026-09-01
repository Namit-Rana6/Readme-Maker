import { fetchPublicGitHubUser } from "./data/github/client";
import { GitHubStatsWidget } from "./widgets/github-stats/github-stats";
import type { GitHubStatsData } from "./widgets/github-stats/types";

const BACKEND_STATS_URL = "http://localhost:3001/api/github/stats";

export const sampleGitHubStatsData: GitHubStatsData = {
  username: "Namit Rana",
  stars: 1,
  commits: 87,
  pullRequests: 12,
  issues: 4,
  codingHours: 63.1,
  repositories: 27,
  followers: 100,
};

export function renderGitHubStatsPreview(
  preview: HTMLElement | null,
  data: GitHubStatsData = sampleGitHubStatsData,
): void {
  const widget = new GitHubStatsWidget();
  const svg = widget.render(data);

  if (preview) {
    preview.innerHTML = svg;
  }
}

async function fetchGitHubStatsFromBackend(
  username: string,
): Promise<GitHubStatsData> {
  const response = await fetch(
    `${BACKEND_STATS_URL}?username=${encodeURIComponent(username)}`,
  );

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    throw new Error(
      errorPayload.error ??
        `Backend request failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as GitHubStatsData;
}

if (typeof document !== "undefined") {
  const preview = document.getElementById("preview");
  const form = document.getElementById("github-user-form");
  const input = document.getElementById("github-username") as HTMLInputElement | null;
  const status = document.getElementById("status");

  renderGitHubStatsPreview(preview);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = input?.value.trim();
    if (!username || !preview) {
      return;
    }

    if (status) {
      status.textContent = "Loading...";
    }

    try {
      let data: GitHubStatsData;

      try {
        data = await fetchGitHubStatsFromBackend(username);
        if (status) {
          status.textContent = `Loaded full stats for ${username}`;
        }
      } catch (backendError) {
        data = await fetchPublicGitHubUser(username);
        if (status) {
          status.textContent =
            backendError instanceof Error
              ? `Used public fallback for ${username}. ${backendError.message}`
              : `Used public fallback for ${username}.`;
        }
      }

      renderGitHubStatsPreview(preview, data);
    } catch (error) {
      if (status) {
        status.textContent =
          error instanceof Error ? error.message : "Could not load profile.";
      }
    }
  });
}

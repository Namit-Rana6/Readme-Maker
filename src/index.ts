import { fetchPublicGitHubUser } from "./data/github/client";
import { themes, type ThemeName, type WidgetTheme } from "./core/theme";
import {
  GitHubStatsWidget,
  type GitHubStatKey,
} from "./widgets/github-stats/github-stats";
import {
  GitHubLanguagesWidget,
  GitHubMiniBadgeWidget,
  GitHubSparklineWidget,
  GitHubGridWidget,
} from "./widgets/github-embeds";
import type { GitHubStatsData } from "./widgets/github-stats/types";

const BACKEND_STATS_URL = "/api/github/stats";

let latestData: GitHubStatsData | null = null;
let selectedTheme: ThemeName | "custom" = "default";
let customTheme: WidgetTheme = { ...themes.default };
let selectedMode = "stats";
let selectedLayout: "standard" | "hidden" = "standard";
const supportedStatKeys = new Set<GitHubStatKey>([
  "username",
  "name",
  "followers",
  "following",
  "repositories",
  "commits",
  "issues",
  "pullRequests",
  "pullRequestReviews",
  "repositoryContributions",
  "contributions",
]);

function getSelectedTheme(): WidgetTheme {
  return selectedTheme === "custom" ? customTheme : themes[selectedTheme];
}

function updateThemePalette(): void {
  if (typeof document === "undefined") return;

  const theme = getSelectedTheme();
  document.querySelectorAll<HTMLElement>("[data-palette-color]").forEach((swatch) => {
    const colorKey = swatch.dataset.paletteColor as keyof typeof theme;
    swatch.style.backgroundColor = theme[colorKey];
    swatch.title = `${colorKey}: ${theme[colorKey]}`;
  });
}

function updateGeneratedCode(): void {
  if (typeof document === "undefined") return;

  const username =
    (document.getElementById("github-username") as HTMLInputElement | null)
      ?.value.trim() || "Namit-Rana6";
  const theme = selectedTheme;
  const radius =
    (document.getElementById("border-radius") as HTMLInputElement | null)
      ?.value || "6";
  const embed = selectedMode === "stats" ? "stats" : selectedMode;
  const params = new URLSearchParams({ username, theme, radius });

  // Custom title
  const titleVal = (document.getElementById("custom-title") as HTMLInputElement | null)?.value.trim();
  if (titleVal) params.set("title", titleVal);

  // showIcons — only set when explicitly toggled on (default off)
  const showIconsChecked = (document.getElementById("show-icons") as HTMLInputElement | null)?.checked;
  if (showIconsChecked) params.set("showIcons", "1");

  // hideBorder
  const hideBorderChecked = (document.getElementById("hide-border") as HTMLInputElement | null)?.checked;
  if (hideBorderChecked) params.set("hideBorder", "1");

  // hideTitle
  const hideTitleChecked = (document.getElementById("hide-title") as HTMLInputElement | null)?.checked;
  if (hideTitleChecked) params.set("hideTitle", "1");

  const selectedStats = Array.from(
    document.querySelectorAll<HTMLInputElement>("input[data-stat-key]:checked"),
  )
    .map((input) => input.dataset.statKey)
    .filter(
      (key): key is GitHubStatKey =>
        Boolean(key) && supportedStatKeys.has(key as GitHubStatKey),
    );
  if (selectedStats.length) params.set("stats", selectedStats.join(","));
  if (selectedLayout === "hidden") params.set("layout", "hidden");
  if (selectedTheme === "custom") {
    Object.entries(customTheme).forEach(([key, value]) => {
      params.set(key, value);
    });
  }
  const link = `https://readme-maker-ashen.vercel.app/api/${embed}?${params}`;
  const values: Record<string, string> = {
    link,
    markdown: `![GitHub ${embed} for ${username}](${link})`,
    html: `<img src="${link}" alt="GitHub ${embed} for ${username}" />`,
  };

  Object.entries(values).forEach(([key, value]) => {
    const output = document.querySelector(`[data-generated="${key}"]`);
    if (output) output.textContent = value;
  });
}

export function renderGitHubStatsPreview(
  preview: HTMLElement | null,
  data: GitHubStatsData | null = latestData,
  options: ConstructorParameters<typeof GitHubStatsWidget>[0] = {},
): void {
  latestData = data;
  if (!data) {
    if (preview) {
      preview.innerHTML = `<div class="coming-soon"><strong>Enter a GitHub username</strong></div>`;
    }
    return;
  }

  // Hidden layout — render the 3×N grid card
  if (selectedLayout === "hidden") {
    const embedOptions = {
      theme: getSelectedTheme(),
      borderRadius: options.borderRadius,
      title: options.title,
      visibleStats: options.visibleStats as string[] | undefined,
      showIcons: options.showIcons !== false,
      hideBorder: options.hideBorder ?? false,
      hideTitle: options.hideTitle ?? false,
      centreTitle: (options as any).centreTitle ?? false,
    };
    const svg = new GitHubGridWidget(embedOptions).render(data);
    if (preview) preview.innerHTML = svg;
    return;
  }

  // Non-stats modes (coming soon)
  if (selectedMode !== "stats") {
    if (preview) {
      preview.innerHTML = `<div class="coming-soon"><div class="coming-soon-emoji">🚀</div><strong>COMING SOON</strong></div>`;
    }
    return;
  }

  const embedOptions = { ...options, theme: options.theme ?? getSelectedTheme() };
  let svg: string;

  if (selectedMode === "languages") {
    svg = new GitHubLanguagesWidget(embedOptions).render(data);
  } else if (selectedMode === "badge") {
    svg = new GitHubMiniBadgeWidget(embedOptions).render(data);
  } else if (selectedMode === "sparkline") {
    svg = new GitHubSparklineWidget(embedOptions).render(data);
  } else {
    svg = new GitHubStatsWidget(embedOptions).render(data);
  }

  if (preview) {
    preview.innerHTML = svg;
  }
}

async function fetchGitHubStatsFromBackend(
  username: string,
): Promise<GitHubStatsData> {
  const response = await fetch(
    `${BACKEND_STATS_URL}?username=${encodeURIComponent(username)}&theme=${selectedTheme}`,
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
  const titleInput = document.getElementById("custom-title") as HTMLInputElement | null;
  const radiusInput = document.getElementById("border-radius") as HTMLInputElement | null;
  const radiusValue = document.getElementById("border-radius-value");
  const iconsInput = document.getElementById("show-icons") as HTMLInputElement | null;
  const borderInput = document.getElementById("hide-border") as HTMLInputElement | null;
  const titleVisibilityInput = document.getElementById("hide-title") as HTMLInputElement | null;
  const centreTitleInput = document.getElementById("centre-title") as HTMLInputElement | null;
  const themeInput = document.getElementById("theme") as HTMLSelectElement | null;
  const themeTrigger = document.getElementById("theme-picker-trigger");
  const themeOptions = document.getElementById("theme-options");
  const customColorInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("input[data-custom-color]"),
  );
  const applyCustomTheme = document.getElementById("apply-custom-theme");
  const statInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("input[data-stat-key]"),
  );

  const rerender = () => {
    if (radiusValue && radiusInput) radiusValue.textContent = radiusInput.value;
    renderGitHubStatsPreview(preview, latestData, {
      title: titleInput?.value.trim() || undefined,
      borderRadius: Number(radiusInput?.value || 6),
      showIcons: iconsInput?.checked,
      hideTitle: titleVisibilityInput?.checked,
      hideBorder: borderInput?.checked,
      centreTitle: centreTitleInput?.checked,
      theme: getSelectedTheme(),
      visibleStats: statInputs
        .filter((statInput) => statInput.checked)
        .map((statInput) => statInput.dataset.statKey as GitHubStatKey),
    });
    updateGeneratedCode();
  };
  renderGitHubStatsPreview(preview, latestData);
  updateGeneratedCode();
  updateThemePalette();

  themeOptions && Object.entries(themes).forEach(([name, theme]) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "theme-option";
    option.innerHTML = `<span class="theme-option-name">${name.replace(/([A-Z])/g, " $1")}</span><span class="theme-swatches">${Object.values(theme).map((color) => `<span style="background:${color}"></span>`).join("")}</span>`;
    option.addEventListener("click", () => {
      selectedTheme = name as ThemeName;
      if (themeInput) themeInput.value = name;
      if (themeTrigger) themeTrigger.textContent = option.querySelector(".theme-option-name")?.textContent ?? name;
      // Close the picker dropdown
      const picker = document.getElementById("theme-picker") as HTMLDetailsElement | null;
      if (picker) picker.removeAttribute("open");
      rerender();
      updateThemePalette();
    });
    themeOptions.appendChild(option);
  });

  [titleInput, radiusInput, iconsInput, borderInput, titleVisibilityInput, centreTitleInput, ...statInputs].forEach((control) => {
    control?.addEventListener("input", rerender);
    control?.addEventListener("change", rerender);
  });
  input?.addEventListener("input", updateGeneratedCode);

  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-mode]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selectedMode = button.dataset.mode ?? "stats";
      updateGeneratedCode();
      if (selectedMode === "stats") {
        rerender();
        if (status) status.textContent = "Live preview refreshes automatically";
        return;
      }

      renderGitHubStatsPreview(preview, latestData);
      if (status) status.textContent = `${button.textContent} coming soon`;
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-layout]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedLayout = button.dataset.layout === "hidden" ? "hidden" : "standard";
      document.querySelectorAll("[data-layout]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      rerender();
      if (status) {
        status.textContent = selectedLayout === "hidden"
          ? "Grid layout — 3×N card"
          : "Live preview refreshes automatically";
      }
    });
  });

  themeInput?.addEventListener("change", () => {
    selectedTheme = themeInput.value as ThemeName;
    if (themeTrigger) themeTrigger.textContent = themeInput.selectedOptions[0]?.textContent ?? themeInput.value;
    rerender();
    updateThemePalette();
  });

  customColorInputs.forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.customColor as keyof WidgetTheme;
      customTheme[key] = input.value;
      selectedTheme = "custom";
      if (themeTrigger) themeTrigger.textContent = "Custom theme";
      rerender();
      updateThemePalette();
    });
  });

  applyCustomTheme?.addEventListener("click", () => {
    selectedTheme = "custom";
    if (themeTrigger) themeTrigger.textContent = "Custom theme";
    rerender();
    updateThemePalette();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const output = document.querySelector(
        `[data-generated="${button.dataset.copy}"]`,
      );
      if (!output?.textContent) return;
      await navigator.clipboard.writeText(output.textContent);
      const original = button.textContent;
      button.textContent = "COPIED";
      window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    });
  });

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

      latestData = data;
      rerender();
    } catch (error) {
      if (status) {
        status.textContent =
          error instanceof Error ? error.message : "Could not load profile.";
      }
    }
  });
}

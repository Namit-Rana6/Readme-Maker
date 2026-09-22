import { fetchPublicGitHubUser } from "./data/github/client";
import { themes, type ThemeName, type WidgetTheme } from "./core/theme";
import {
  GitHubStatsWidget,
  type GitHubStatKey,
} from "./widgets/github-stats/github-stats";
import {
  GitHubMiniBadgeWidget,
  GitHubSparklineWidget,
  GitHubGridWidget,
} from "./widgets/github-embeds";
import { TopLanguagesWidget } from "./widgets/top-languages/top-languages-widget";
import type { GitHubStatsData } from "./widgets/github-stats/types";
import type { TopLanguagesData } from "./widgets/top-languages/types";
import { initSocialLinksBuilder, teardownSocialLinksBuilder } from "./widgets/social-links/social-links-ui";

const BACKEND_STATS_URL = "/api/github/stats";

let latestData: (GitHubStatsData & Partial<TopLanguagesData>) | null = null;
let selectedTheme: ThemeName | "custom" = "default";
let customTheme: WidgetTheme = { ...themes.default };
let selectedMode = "stats";
let selectedLayout: "standard" | "hidden" = "standard";

// Languages panel has its own independent theme + data state
let langLatestData: (GitHubStatsData & Partial<TopLanguagesData>) | null = null;
let langSelectedTheme: ThemeName | "custom" = "default";
let langCustomTheme: WidgetTheme = { ...themes.default };

// Languages panel controls — populated once DOM is ready
let langLayoutSelect: HTMLSelectElement | null = null;
let langMaxInput: HTMLInputElement | null = null;
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

function getLangTheme(): WidgetTheme {
  return langSelectedTheme === "custom" ? langCustomTheme : themes[langSelectedTheme];
}

function updateThemePalette(): void {
  if (typeof document === "undefined") return;
  const theme = getSelectedTheme();
  document.querySelectorAll<HTMLElement>("[data-palette-color]").forEach((swatch) => {
    const colorKey = swatch.dataset.paletteColor as keyof typeof theme;
    swatch.style.backgroundColor = theme[colorKey];
    swatch.title = `${colorKey}: ${theme[colorKey]}`;
  });
  const langTheme = getLangTheme();
  document.querySelectorAll<HTMLElement>("[data-lang-palette-color]").forEach((swatch) => {
    const colorKey = swatch.dataset.langPaletteColor as keyof typeof langTheme;
    swatch.style.backgroundColor = langTheme[colorKey];
    swatch.title = `${colorKey}: ${langTheme[colorKey]}`;
  });
}

function updateGeneratedCode(): void {
  if (typeof document === "undefined") return;

  const isLang = selectedMode === "languages";

  const username = isLang
    ? (document.getElementById("lang-username") as HTMLInputElement | null)?.value.trim() || "Namit-Rana6"
    : (document.getElementById("github-username") as HTMLInputElement | null)?.value.trim() || "Namit-Rana6";

  const theme  = isLang ? langSelectedTheme : selectedTheme;
  const radius = (document.getElementById("border-radius") as HTMLInputElement | null)?.value || "6";
  const embed  = selectedMode === "stats" ? "stats" : selectedMode === "languages" ? "languages" : selectedMode;

  const params = new URLSearchParams({ username, theme, radius });

  if (isLang) {
    // Lang custom theme colors
    if (langSelectedTheme === "custom") {
      Object.entries(langCustomTheme).forEach(([key, value]) => params.set(key, value));
    }
    // Lang-specific controls
    const langTitle = (document.getElementById("lang-custom-title") as HTMLInputElement | null)?.value.trim();
    if (langTitle) params.set("title", langTitle);
    if ((document.getElementById("lang-hide-border") as HTMLInputElement | null)?.checked) params.set("hideBorder", "1");
    if ((document.getElementById("lang-hide-title")  as HTMLInputElement | null)?.checked) params.set("hideTitle", "1");
    if ((document.getElementById("lang-centre-title") as HTMLInputElement | null)?.checked) params.set("centreTitle", "1");
    const layout = (document.getElementById("lang-layout") as HTMLInputElement | null)?.value;
    if (layout && layout !== "bar") params.set("layout", layout);
    const max = (document.getElementById("lang-max") as HTMLInputElement | null)?.value;
    if (max && max !== "8") params.set("max", max);
  } else {
    // Stats custom theme colors
    if (selectedTheme === "custom") {
      Object.entries(customTheme).forEach(([key, value]) => params.set(key, value));
    }
    const titleVal = (document.getElementById("custom-title") as HTMLInputElement | null)?.value.trim();
    if (titleVal) params.set("title", titleVal);
    if ((document.getElementById("hide-border") as HTMLInputElement | null)?.checked) params.set("hideBorder", "1");
    if ((document.getElementById("hide-title")  as HTMLInputElement | null)?.checked) params.set("hideTitle", "1");
    if ((document.getElementById("centre-title") as HTMLInputElement | null)?.checked) params.set("centreTitle", "1");
    if (!(document.getElementById("show-icons") as HTMLInputElement | null)?.checked) params.set("showIcons", "0");
    const selectedStats = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[data-stat-key]:checked"),
    ).map((i) => i.dataset.statKey).filter((k): k is GitHubStatKey => Boolean(k) && supportedStatKeys.has(k as GitHubStatKey));
    if (selectedStats.length) params.set("stats", selectedStats.join(","));
    if (selectedLayout === "hidden") params.set("layout", "hidden");
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
  data: (GitHubStatsData & Partial<TopLanguagesData>) | null = latestData,
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

  // Languages mode
  if (selectedMode === "languages") {
    const activeData = langLatestData ?? data;
    const langOptions = {
      theme:        getLangTheme(),
      borderRadius: options.borderRadius,
      title:        (document.getElementById("lang-custom-title") as HTMLInputElement | null)?.value.trim() || undefined,
      hideBorder:   (document.getElementById("lang-hide-border") as HTMLInputElement | null)?.checked ?? false,
      hideTitle:    (document.getElementById("lang-hide-title")  as HTMLInputElement | null)?.checked ?? false,
      centreTitle:  (document.getElementById("lang-centre-title") as HTMLInputElement | null)?.checked ?? false,
      layout:       ((document.getElementById("lang-layout") as HTMLInputElement | null)?.value as "bar" | "compact" | "stacked" | "donut" | "donut-vertical" | "horizontal-list" | "vertical-list" | "grid" | "treemap" | "pie-list") ?? "bar",
      maxLanguages: Number(langMaxInput?.value ?? 8),
    };
    const langData: TopLanguagesData = {
      username:  activeData?.username,
      languages: activeData?.languages ?? [],
    };
    const svg = new TopLanguagesWidget(langOptions).render(langData);
    if (preview) preview.innerHTML = svg;
    return;
  }

  // Social links mode
  if (selectedMode === "badge") {
    if (preview) {
      preview.innerHTML = `<div class="coming-soon"><div class="coming-soon-emoji">🚀</div><strong>COMING SOON</strong></div>`;
    }
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
  const svg = new GitHubStatsWidget(embedOptions).render(data);

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
  const status = document.getElementById("status-msg");
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
    if (selectedMode === "languages") {
      // Languages mode — just call the preview directly (no stats options needed)
      renderGitHubStatsPreview(preview, latestData);
    } else {
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
    }
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

  const statsCardControls = document.getElementById("stats-card-controls");
  const socialLinksPanel  = document.getElementById("social-links-panel");
  const languagesPanel    = document.getElementById("languages-panel");
  langLayoutSelect  = document.getElementById("lang-layout") as HTMLSelectElement | null;
  langMaxInput      = document.getElementById("lang-max") as HTMLInputElement | null;

  // ── Languages panel controls ──────────────────────────────────────────────

  // Max languages slider — update value label AND rerender
  langMaxInput?.addEventListener("input", () => {
    const display = document.getElementById("lang-max-value");
    if (display && langMaxInput) display.textContent = langMaxInput.value;
    rerender();
  });

  // Appearance checkboxes
  ["lang-hide-title", "lang-hide-border", "lang-centre-title"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", rerender);
  });

  // Custom title input
  document.getElementById("lang-custom-title")?.addEventListener("input", rerender);

  // Layout button grid
  document.querySelectorAll<HTMLButtonElement>("[data-lang-layout]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-lang-layout]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const hidden = document.getElementById("lang-layout") as HTMLInputElement | null;
      if (hidden) hidden.value = btn.dataset.langLayout ?? "bar";
      rerender();
    });
  });

  // ── Languages theme picker ────────────────────────────────────────────────
  const langThemeOptionsEl  = document.getElementById("lang-theme-options");
  const langThemeTriggerEl  = document.getElementById("lang-theme-picker-trigger");
  const langApplyCustomEl   = document.getElementById("lang-apply-custom-theme");
  const langCustomColorInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("input[data-lang-custom-color]"),
  );

  langThemeOptionsEl && Object.entries(themes).forEach(([name, theme]) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "theme-option";
    option.innerHTML = `<span class="theme-option-name">${name.replace(/([A-Z])/g, " $1")}</span><span class="theme-swatches">${Object.values(theme).map((color) => `<span style="background:${color}"></span>`).join("")}</span>`;
    option.addEventListener("click", () => {
      langSelectedTheme = name as ThemeName;
      if (langThemeTriggerEl) langThemeTriggerEl.textContent = option.querySelector(".theme-option-name")?.textContent ?? name;
      const picker = document.getElementById("lang-theme-picker") as HTMLDetailsElement | null;
      if (picker) picker.removeAttribute("open");
      rerender();
      updateThemePalette();
    });
    langThemeOptionsEl.appendChild(option);
  });

  langCustomColorInputs.forEach((inp) => {
    inp.addEventListener("input", () => {
      const key = inp.dataset.langCustomColor as keyof WidgetTheme;
      langCustomTheme[key] = inp.value;
      langSelectedTheme = "custom";
      if (langThemeTriggerEl) langThemeTriggerEl.textContent = "Custom theme";
      rerender();
      updateThemePalette();
    });
  });

  langApplyCustomEl?.addEventListener("click", () => {
    langSelectedTheme = "custom";
    if (langThemeTriggerEl) langThemeTriggerEl.textContent = "Custom theme";
    rerender();
    updateThemePalette();
  });

  // ── Languages username load ────────────────────────────────────────────────
  const langUsernameInput = document.getElementById("lang-username") as HTMLInputElement | null;
  const langLoadBtn       = document.getElementById("lang-load-btn") as HTMLButtonElement | null;
  const langStatusMsg     = document.getElementById("lang-status-msg");

  async function loadLangUser() {
    const username = langUsernameInput?.value.trim();
    if (!username || !preview) return;
    if (langStatusMsg) langStatusMsg.textContent = "Loading…";
    try {
      let data: GitHubStatsData & Partial<TopLanguagesData>;
      try {
        const resp = await fetch(`/api/github/stats?username=${encodeURIComponent(username)}`);
        if (!resp.ok) throw new Error(`${resp.status}`);
        data = await resp.json() as GitHubStatsData & Partial<TopLanguagesData>;
        if (langStatusMsg) langStatusMsg.textContent = `Loaded languages for ${username}`;
      } catch {
        data = await fetchPublicGitHubUser(username) as GitHubStatsData & Partial<TopLanguagesData>;
        if (langStatusMsg) langStatusMsg.textContent = `Public fallback for ${username} — language data may be limited`;
      }
      langLatestData = data;
      rerender();
      updateGeneratedCode();
    } catch (err) {
      if (langStatusMsg) langStatusMsg.textContent = err instanceof Error ? err.message : "Could not load profile.";
    }
  }

  langLoadBtn?.addEventListener("click", loadLangUser);
  langUsernameInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); loadLangUser(); } });
  langUsernameInput?.addEventListener("input", updateGeneratedCode);

  // Show/hide the right panel when mode changes
  function switchMode(mode: string) {
    if (mode === "badge") {
      if (statsCardControls) statsCardControls.style.display = "none";
      if (languagesPanel)    languagesPanel.style.display    = "none";
      if (socialLinksPanel)  socialLinksPanel.style.display  = "block";
      initSocialLinksBuilder(preview, socialLinksPanel);
    } else if (mode === "languages") {
      if (statsCardControls) statsCardControls.style.display = "none";
      if (socialLinksPanel)  { socialLinksPanel.style.display = "none"; teardownSocialLinksBuilder(socialLinksPanel); }
      if (languagesPanel)    languagesPanel.style.display    = "block";
      // Show placeholder if no lang data loaded yet
      if (!langLatestData && preview) {
        preview.innerHTML = `<div class="coming-soon"><strong>Enter a username and hit Load</strong></div>`;
      }
    } else {
      if (statsCardControls) statsCardControls.style.display = "block";
      if (languagesPanel)    languagesPanel.style.display    = "none";
      if (socialLinksPanel)  { socialLinksPanel.style.display = "none"; teardownSocialLinksBuilder(socialLinksPanel); }
    }
  }

  document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-mode]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selectedMode = button.dataset.mode ?? "stats";
      switchMode(selectedMode);
      updateGeneratedCode();
      if (selectedMode === "stats") {
        rerender();
        if (status) status.textContent = "Live preview refreshes automatically";
        return;
      }
      if (selectedMode === "badge") {
        if (status) status.textContent = "Social links card";
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
      const text = output?.textContent;
      if (!text) return;

      try {
        // Preferred: async clipboard API (requires HTTPS or localhost)
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback: execCommand for non-secure contexts
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

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

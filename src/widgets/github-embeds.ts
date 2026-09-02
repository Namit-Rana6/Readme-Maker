import { escapeXml } from "../core/svg/escape";
import { themes, type WidgetTheme } from "../core/theme";
import type { GitHubStatsData } from "./github-stats/types";

export interface EmbedWidgetOptions {
  theme?: WidgetTheme;
  borderRadius?: number;
  hideBorder?: boolean;
}

function frame(
  width: number,
  height: number,
  options: EmbedWidgetOptions,
): { theme: WidgetTheme; opening: string; closing: string } {
  const theme = options.theme ?? themes.default;
  const border = options.hideBorder
    ? ""
    : `stroke="${theme.border}" stroke-width="1.5"`;

  return {
    theme,
    opening: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" rx="${options.borderRadius ?? 8}" fill="${theme.background}" ${border}/>`,
    closing: "</svg>",
  };
}

export class GitHubLanguagesWidget {
  constructor(private readonly options: EmbedWidgetOptions = {}) {}

  render(data: GitHubStatsData): string {
    const { theme, opening, closing } = frame(420, 150, this.options);
    const username = escapeXml(data.username ?? "GitHub user");
    const languages = [
      { name: "TypeScript", percentage: 48, color: theme.accent },
      { name: "JavaScript", percentage: 32, color: theme.title },
      { name: "Other", percentage: 20, color: theme.text },
    ];
    let offset = 20;

    const bars = languages.map((language) => {
      const width = language.percentage * 3.8;
      const bar = `<rect x="${offset}" y="58" width="${width}" height="12" fill="${language.color}"/>`;
      offset += width;
      return bar;
    });

    return `${opening}<text x="20" y="32" fill="${theme.title}" font-size="16" font-weight="700">${username}'s Languages</text><rect x="20" y="58" width="380" height="12" fill="${theme.border}"/>${bars.join("")}<text x="20" y="102" fill="${theme.text}" font-size="12">TypeScript 48%</text><text x="160" y="102" fill="${theme.text}" font-size="12">JavaScript 32%</text><text x="300" y="102" fill="${theme.text}" font-size="12">Other 20%</text>${closing}`;
  }
}

export class GitHubMiniBadgeWidget {
  constructor(private readonly options: EmbedWidgetOptions = {}) {}

  render(data: GitHubStatsData): string {
    const { theme, opening, closing } = frame(300, 72, this.options);
    const username = escapeXml(data.username ?? "GitHub user");
    const followers = data.followers ?? 0;

    return `${opening}<text x="20" y="29" fill="${theme.title}" font-size="14" font-weight="700">${username}</text><text x="20" y="51" fill="${theme.text}" font-size="12">${followers} followers</text><circle cx="266" cy="36" r="18" fill="${theme.accent}" opacity="0.2"/><text x="266" y="41" text-anchor="middle" fill="${theme.accent}" font-size="16" font-weight="700">GH</text>${closing}`;
  }
}

export class GitHubSparklineWidget {
  constructor(private readonly options: EmbedWidgetOptions = {}) {}

  render(data: GitHubStatsData): string {
    const { theme, opening, closing } = frame(420, 130, this.options);
    const username = escapeXml(data.username ?? "GitHub user");
    const points = "20,95 75,78 130,86 185,48 240,66 295,34 350,52 400,24";

    return `${opening}<text x="20" y="30" fill="${theme.title}" font-size="16" font-weight="700">${username}'s Activity</text><polyline points="${points}" fill="none" stroke="${theme.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="20" y="116" fill="${theme.text}" font-size="12">${data.contributions ?? 0} contributions this year</text>${closing}`;
  }
}

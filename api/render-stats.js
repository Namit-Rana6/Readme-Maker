const statDefinitions = [
  ["username", "Username:"],
  ["name", "Name:"],
  ["followers", "Followers:"],
  ["following", "Following:"],
  ["gists", "Public Gists:"],
  ["organizations", "Organizations:"],
  ["repositories", "Public Repositories:"],
  ["stars", "Total Stars Earned:"],
  ["contributedRepositories", "Contributed Repositories:"],
  ["commits", "Commits:"],
  ["issues", "Total Issues:"],
  ["pullRequests", "Total Pull Requests:"],
  ["pullRequestReviews", "Total PR Reviews:"],
  ["repositoryContributions", "Repository Contributions:"],
  ["restrictedContributions", "Restricted Contributions:"],
  ["contributions", "Total Contributions:"],
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function renderStatsSvg(stats, options = {}) {
  const theme = options.theme;
  const selected = options.visibleStats?.length
    ? options.visibleStats
    : statDefinitions.map(([key]) => key);
  const rows = statDefinitions
    .filter(([key]) => selected.includes(key))
    .map(([key, label]) => ({ key, label, value: stats[key] }))
    .filter(({ value }) => value !== undefined && value !== null && value !== "" && value !== 0);
  const hideTitle = options.hideTitle === true;
  const hideBorder = options.hideBorder === true;
  const showIcons = options.showIcons === true;
  const rowStart = hideTitle ? 30 : 60;
  const height = (hideTitle ? 40 : 80) + rows.length * 20;
  const border = hideBorder ? "" : `stroke="${theme.border}" stroke-width="1.5"`;
  const title = escapeXml(options.title?.trim() || `${stats.username ?? "GitHub"}'s GitHub Stats`);
  const rowMarkup = rows.map(({ label, value }, index) => {
    const y = rowStart + index * 20;
    const textX = showIcons ? 48 : 24;
    const iconMarkup = showIcons
      ? `<g transform="translate(20 ${y - 6.5}) scale(0.7)"><circle cx="8" cy="8" r="7" fill="none" stroke="${theme.accent}" stroke-width="1.8"/></g>`
      : "";
    return `${iconMarkup}<text x="${textX}" y="${y}" dominant-baseline="middle" font-size="12" fill="${theme.text}">${escapeXml(label)}</text><text x="480" y="${y}" dominant-baseline="middle" text-anchor="end" font-size="12" font-weight="600" fill="${theme.value}">${escapeXml(value)}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${height}" viewBox="0 0 500 ${height}"><rect width="500" height="${height}" rx="${options.borderRadius ?? 6}" fill="${theme.background}" ${border}/>${hideTitle ? "" : `<text x="20" y="30" fill="${theme.title}" font-size="16" font-weight="700">${title}</text>`}${rowMarkup}</svg>`;
}

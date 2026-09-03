import type { WidgetTheme } from "../../core/theme.ts";

export interface StatRowOptions {
  /** Inline <g> SVG markup for the icon, or empty string for no icon. */
  icon: string;
  label: string;
  value: string | number;
  y: number;
  theme: WidgetTheme;
}

const ICON_SIZE = 16; // must match the size passed to getGitHubIcon
const ICON_LEFT = 20; // x offset for the icon's left edge
const TEXT_X_ICON = 44; // label x when an icon is shown  (ICON_LEFT + ICON_SIZE + gap)
const TEXT_X_BARE = 24; // label x when no icon

export function renderStatRow({
  icon,
  label,
  value,
  y,
  theme,
}: StatRowOptions): string {
  const hasIcon = Boolean(icon);
  const textX   = hasIcon ? TEXT_X_ICON : TEXT_X_BARE;

  // Translate the icon so it is vertically centred on the row
  const iconMarkup = hasIcon
    ? `<g transform="translate(${ICON_LEFT} ${y - ICON_SIZE / 2})">${icon}</g>`
    : "";

  return `
    <g>
      ${iconMarkup}
      <text
        x="${textX}"
        y="${y}"
        dominant-baseline="middle"
        font-size="12"
        fill="${theme.text}"
      >
        ${label}
      </text>

      <text
        x="480"
        y="${y}"
        dominant-baseline="middle"
        text-anchor="end"
        font-size="12"
        font-weight="600"
        fill="${theme.value}"
      >
        ${value}
      </text>
    </g>
  `.trim();
}

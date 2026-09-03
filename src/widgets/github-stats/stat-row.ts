import type { WidgetTheme } from "../../core/theme.ts";

export interface StatRowOptions {
  icon: string;
  label: string;
  value: string | number;
  y: number;
  theme: WidgetTheme;
}

export function renderStatRow({
  icon,
  label,
  value,
  y,
  theme,
}: StatRowOptions): string {
  return `
    <g>
      <g transform="translate(20 ${y - 6.5}) scale(0.7)">
        ${icon}
      </g>

      <text
        x="48"
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
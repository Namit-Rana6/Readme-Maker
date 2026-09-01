export interface StatRowOptions {
  icon: string;
  label: string;
  value: string | number;
  y: number;
}

export function renderStatRow({
  icon,
  label,
  value,
  y,
}: StatRowOptions): string {
  return `
    <g>
      <g transform="translate(20 ${y - 10}) scale(0.7)">
        ${icon}
      </g>

      <text
        x="48"
        y="${y}"
        dominant-baseline="middle"
        font-size="12"
        fill="#e6edf3"
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
        fill="#ffffff"
      >
        ${value}
      </text>
    </g>
  `.trim();
}
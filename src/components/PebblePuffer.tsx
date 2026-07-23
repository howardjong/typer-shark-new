interface Props {
  variant: number;
}

const VARIANT_COLORS = [
  { body: "#ff8a5c", fin: "#e56b3e", belly: "#ffd9a0" }, // coral orange
  { body: "#3ecfb2", fin: "#2aa892", belly: "#c9f7ee" }, // teal
  { body: "#f4c542", fin: "#d9a51f", belly: "#fdeec2" }, // warm gold
  { body: "#8bc46a", fin: "#6da04c", belly: "#dff0cf" }, // moss green
];

/** Original chunky block-fish, drawn from simple rectangles. */
export function PebblePuffer({ variant }: Props) {
  const c = VARIANT_COLORS[variant % VARIANT_COLORS.length];
  return (
    <svg
      className="puffer"
      viewBox="0 0 64 48"
      width="72"
      height="54"
      aria-hidden="true"
      focusable="false"
    >
      {/* tail */}
      <rect x="50" y="16" width="10" height="16" fill={c.fin} />
      <rect x="56" y="10" width="6" height="28" fill={c.fin} />
      {/* body blocks */}
      <rect x="10" y="8" width="40" height="32" fill={c.body} />
      <rect x="14" y="4" width="32" height="8" fill={c.body} />
      <rect x="14" y="36" width="32" height="8" fill={c.body} />
      {/* belly */}
      <rect x="14" y="28" width="28" height="10" fill={c.belly} />
      {/* top fin */}
      <rect x="24" y="0" width="12" height="6" fill={c.fin} />
      {/* eye: white block + dark pupil */}
      <rect x="14" y="14" width="10" height="10" fill="#ffffff" />
      <rect x="16" y="16" width="6" height="6" fill="#15243c" />
      {/* smile */}
      <rect x="10" y="26" width="8" height="4" fill="#15243c" opacity="0.6" />
    </svg>
  );
}

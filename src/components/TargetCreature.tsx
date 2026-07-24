import type { OrdinaryTargetFamily } from "../game/targetTypes";
import { PebblePuffer } from "./PebblePuffer";

interface Props {
  family: OrdinaryTargetFamily;
  variant: number;
}

/** Original compact SVG creatures; labels remain separate, real DOM text. */
export function TargetCreature({ family, variant }: Props) {
  if (family === "pebble-puffer") return <PebblePuffer variant={variant} />;
  if (family === "tile-ray") {
    return (
      <svg className="target-creature tile-ray" viewBox="0 0 76 48" width="84" height="54" aria-hidden="true">
        <path d="M4 24 28 6h36l8 18-8 18H28z" fill="#3ecfb2" />
        <path d="M14 24 32 12h24l8 12-8 12H32z" fill="#c9f7ee" />
        <rect x="20" y="20" width="8" height="8" fill="#15243c" />
        <rect x="64" y="18" width="10" height="12" fill="#2aa892" />
      </svg>
    );
  }
  if (family === "shellback") {
    return (
      <svg className="target-creature shellback" viewBox="0 0 76 48" width="84" height="54" aria-hidden="true">
        <rect x="16" y="10" width="42" height="28" rx="4" fill="#8bc46a" />
        <rect x="24" y="14" width="26" height="20" fill="#dff0cf" />
        <rect x="58" y="18" width="14" height="14" fill="#8bc46a" />
        <rect x="68" y="20" width="4" height="4" fill="#15243c" />
        <rect x="8" y="8" width="10" height="10" fill="#6da04c" />
        <rect x="8" y="30" width="10" height="10" fill="#6da04c" />
        <rect x="46" y="4" width="10" height="8" fill="#6da04c" />
      </svg>
    );
  }
  if (family === "prism-eel") {
    return (
      <svg className="target-creature prism-eel" viewBox="0 0 92 40" width="100" height="48" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((segment) => (
          <polygon
            key={segment}
            points={`${8 + segment * 15},20 ${15 + segment * 15},6 ${23 + segment * 15},20 ${15 + segment * 15},34`}
            fill={["#9b7fe8", "#6fbcff", "#3ecfb2"][((segment + variant) % 3)]}
          />
        ))}
        <rect x="82" y="16" width="8" height="8" fill="#ffffff" />
        <rect x="84" y="18" width="4" height="4" fill="#15243c" />
      </svg>
    );
  }
  if (family === "spark-school") {
    return (
      <svg className="target-creature spark-school" viewBox="0 0 82 40" width="90" height="48" aria-hidden="true">
        <rect x="8" y="12" width="18" height="18" fill="#f4c542" />
        <rect x="32" y="6" width="18" height="18" fill="#ff8a5c" />
        <rect x="56" y="14" width="18" height="18" fill="#3ecfb2" />
        <rect x="14" y="16" width="5" height="5" fill="#15243c" />
        <rect x="38" y="10" width="5" height="5" fill="#15243c" />
        <rect x="62" y="18" width="5" height="5" fill="#15243c" />
      </svg>
    );
  }
  return (
    <svg className="target-creature treasure-bubble" viewBox="0 0 56 56" width="64" height="64" aria-hidden="true">
      <rect x="8" y="8" width="40" height="40" rx="12" fill="#f4c542" opacity="0.9" />
      <rect x="15" y="15" width="14" height="14" fill="#fdeec2" opacity="0.9" />
      <rect x="33" y="33" width="8" height="8" fill="#d9a51f" />
    </svg>
  );
}

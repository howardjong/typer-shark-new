/**
 * Original Block Reef target families and their rule-level behaviour. Visual
 * components may interpret these families differently, but the engine owns
 * the parts that affect fairness, timing, scoring, and Reef Shield safety.
 */
export type TargetFamilyId =
  | "pebble-puffer"
  | "tile-ray"
  | "shellback"
  | "prism-eel"
  | "spark-school"
  | "treasure-bubble"
  | "current-gate";

export type OrdinaryTargetFamily = Exclude<TargetFamilyId, "current-gate">;

export interface TargetFamilyRule {
  /** A Shellback is the only ordinary target with two labels in v1. */
  stages: 1 | 2;
  /** Treasure Bubbles drift away without costing a heart. */
  collisionCostsHeart: boolean;
  /** Only completed ordinary targets fill the Reef Shield. */
  chargesReefShield: boolean;
  /** Reef Shield must never clear a Current Gate or optional bonus target. */
  clearableByReefShield: boolean;
  /** Bonus words use the optional three-letter bank when one is supplied. */
  usesBonusLabels: boolean;
}

export const TARGET_FAMILY_RULES: Readonly<Record<TargetFamilyId, TargetFamilyRule>> = {
  "pebble-puffer": {
    stages: 1,
    collisionCostsHeart: true,
    chargesReefShield: true,
    clearableByReefShield: true,
    usesBonusLabels: false,
  },
  "tile-ray": {
    stages: 1,
    collisionCostsHeart: true,
    chargesReefShield: true,
    clearableByReefShield: true,
    usesBonusLabels: false,
  },
  shellback: {
    stages: 2,
    collisionCostsHeart: true,
    chargesReefShield: true,
    clearableByReefShield: true,
    usesBonusLabels: false,
  },
  "prism-eel": {
    stages: 1,
    collisionCostsHeart: true,
    chargesReefShield: true,
    clearableByReefShield: true,
    usesBonusLabels: false,
  },
  "spark-school": {
    stages: 1,
    collisionCostsHeart: true,
    chargesReefShield: true,
    clearableByReefShield: true,
    usesBonusLabels: false,
  },
  "treasure-bubble": {
    stages: 1,
    collisionCostsHeart: false,
    chargesReefShield: false,
    clearableByReefShield: false,
    usesBonusLabels: true,
  },
  "current-gate": {
    stages: 1,
    collisionCostsHeart: true,
    chargesReefShield: false,
    clearableByReefShield: false,
    usesBonusLabels: false,
  },
};

export function isOrdinaryTargetFamily(family: TargetFamilyId): family is OrdinaryTargetFamily {
  return family !== "current-gate";
}

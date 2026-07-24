// All tunable game rules live here, not scattered through components.

export type DifficultyId = "starter" | "standard" | "swift";
export type MotionId = "slow" | "normal" | "fast";

/** Slow multiplies travel time and spawn intervals; Fast shortens them. */
export const MOTION_MULTIPLIER: Record<MotionId, number> = {
  slow: 1.35,
  normal: 1,
  fast: 0.85,
};

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  description: string;
  /** Hard ceiling: never spawn faster than this (ms at Normal motion). */
  minSpawnIntervalMs: number;
  maxVisibleTargets: number;
  hearts: number;
  /** Time for a target to cross the safe play area at Normal motion. */
  crossTimeMs: number;
  /** Starter forbids two visible labels with the same first letter. */
  noSameFirstLetter: boolean;
  missionDurationMs: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  starter: {
    id: "starter",
    label: "Starter",
    description: "One letter at a time. Gentle and slow. A cozy first swim.",
    minSpawnIntervalMs: 4500,
    maxVisibleTargets: 3,
    hearts: 3,
    crossTimeMs: 15000,
    noSameFirstLetter: true,
    missionDurationMs: 75000,
  },
  standard: {
    id: "standard",
    label: "Standard",
    description: "A steady current. A little quicker, a little busier.",
    minSpawnIntervalMs: 3000,
    maxVisibleTargets: 4,
    hearts: 3,
    crossTimeMs: 12000,
    noSameFirstLetter: false,
    missionDurationMs: 100000,
  },
  swift: {
    id: "swift",
    label: "Swift",
    description: "For confident typists who like a lively reef.",
    minSpawnIntervalMs: 2000,
    maxVisibleTargets: 5,
    hearts: 2,
    crossTimeMs: 10000,
    noSameFirstLetter: false,
    missionDurationMs: 120000,
  },
};

/** In Starter, a selected target slows down while being typed (never stops). */
export const STARTER_SELECTED_SPEED_FACTOR = 0.75;

/** Clamp a normal frame delta to this many ms. */
export const FRAME_DELTA_CLAMP_MS = 100;

/** If the observed frame gap exceeds this, auto-pause instead of simulating. */
export const STALL_AUTO_PAUSE_MS = 500;

/** Sessions shorter than this show "—" for WPM to avoid misleading spikes. */
export const MIN_ACTIVE_SECONDS_FOR_WPM = 10;

/** Delay before the very first spawn so the child can orient. */
export const FIRST_SPAWN_DELAY_MS = 1800;

/** Retry delay when a readable spawn cannot be placed (bounded, never a busy loop). */
export const SPAWN_RETRY_DELAY_MS = 800;

/** Build Bits earned per completed letter target. */
export const BUILD_BITS_PER_LETTER = 5;

/** A streak badge is awarded every N consecutive completions. */
export const STREAK_BADGE_EVERY = 5;

/** Ordinary target completions needed to fully charge one Reef Shield. */
export const REEF_SHIELD_COMPLETIONS = 10;

/** Number of horizontal swim lanes in the play field. */
export const LANE_COUNT = 4;

/** A lane is considered occupied near spawn if a target is beyond this x. */
export const LANE_SPAWN_CLEARANCE_X = 0.78;

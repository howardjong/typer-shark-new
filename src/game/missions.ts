import type { DifficultyId } from "./config";
import {
  ALL_LETTERS,
  COMMON_SIGHT_WORDS,
  HOME_ROW_LETTERS,
  STANDARD_FAMILIAR_WORDS,
  STARTER_CVC_WORDS,
  TOP_ROW_LETTERS,
  WARMUP_LESSON,
  SWIFT_CHALLENGE_WORDS,
} from "./wordBanks";
import type { TargetFamilyId } from "./targetTypes";

export type { TargetFamilyId } from "./targetTypes";

export type RegionId = "sunlit-shelf" | "kelp-cubes" | "crystal-current";
export type MissionKind = "regular" | "current-gate";

export type MissionId =
  | "warmup-first-letter"
  | "sunlit-top-row"
  | "sunlit-short-words"
  | "sunlit-gate"
  | "kelp-sight-words"
  | "kelp-shellback"
  | "kelp-word-pairs"
  | "kelp-gate"
  | "crystal-prism-words"
  | "crystal-spark-school"
  | "crystal-swift-current"
  | "crystal-gate";

/** All prerequisites must be complete; one `anyOf` completion is enough. */
export interface MissionUnlock {
  allOf?: readonly MissionId[];
  anyOf?: readonly MissionId[];
}

export interface CurrentGateDefinition {
  stabilityBlocks: number;
  maximumVisibleProjectiles: number;
}

export interface MissionDefinition {
  id: MissionId;
  region: RegionId;
  kind: MissionKind;
  title: string;
  description: string;
  lessonLabel: string;
  labels: readonly string[];
  difficulty: DifficultyId;
  durationMs: number;
  targetFamilies: readonly TargetFamilyId[];
  unlock: MissionUnlock;
  /** A cosmetic-only, non-random Pebble Bay reward after a regular mission. */
  buildReward?: string;
  gate?: CurrentGateDefinition;
}

const SUNLIT_WORDS = STARTER_CVC_WORDS.slice(0, 48);
const KELP_SIGHT_WORDS = COMMON_SIGHT_WORDS.filter((word) => word.length >= 3 && word.length <= 5);
const KELP_PAIR_WORDS = COMMON_SIGHT_WORDS.filter((word) => word.length >= 2 && word.length <= 4);

/**
 * Complete Adventure Trail topology: three regions × (first lesson + two
 * parallel lessons + Current Gate). The two branch lessons stay replayable
 * after either one opens the region finale.
 */
export const MISSIONS: readonly MissionDefinition[] = [
  {
    id: "warmup-first-letter",
    region: "sunlit-shelf",
    kind: "regular",
    title: WARMUP_LESSON.title,
    description: "Find the first letter on each Pebble Puffer and guide it back into the current.",
    lessonLabel: WARMUP_LESSON.lessonLabel,
    labels: WARMUP_LESSON.letters,
    difficulty: "starter",
    durationMs: 75_000,
    targetFamilies: ["pebble-puffer"],
    unlock: {},
    buildReward: "sandstone welcome arch",
  },
  {
    id: "sunlit-top-row",
    region: "sunlit-shelf",
    kind: "regular",
    title: "Sunlit Shelf: Top Row",
    description: "Spot the top-row letters as Pebble Puffers float past Pebble Bay.",
    lessonLabel: "Today: top-row letters Q W E R T · Y U I O P",
    labels: TOP_ROW_LETTERS,
    difficulty: "starter",
    durationMs: 75_000,
    targetFamilies: ["pebble-puffer"],
    unlock: { allOf: ["warmup-first-letter"] },
    buildReward: "coral lantern post",
  },
  {
    id: "sunlit-short-words",
    region: "sunlit-shelf",
    kind: "regular",
    title: "Sunlit Shelf: Short Words",
    description: "Read each short Tile Ray label from left to right.",
    lessonLabel: "Today: short words with A, E, I, O, and U",
    labels: SUNLIT_WORDS,
    difficulty: "starter",
    durationMs: 90_000,
    targetFamilies: ["tile-ray", "treasure-bubble"],
    unlock: { allOf: ["warmup-first-letter"] },
    buildReward: "warm sand path",
  },
  {
    id: "sunlit-gate",
    region: "sunlit-shelf",
    kind: "current-gate",
    title: "Sunlit Gate",
    description: "Redirect the gentle letter cubes to settle the Sunlit Gate.",
    lessonLabel: "Today: steady single letters",
    labels: HOME_ROW_LETTERS,
    difficulty: "starter",
    durationMs: 90_000,
    targetFamilies: ["current-gate"],
    unlock: {
      allOf: ["warmup-first-letter"],
      anyOf: ["sunlit-top-row", "sunlit-short-words"],
    },
    gate: { stabilityBlocks: 8, maximumVisibleProjectiles: 3 },
  },
  {
    id: "kelp-sight-words",
    region: "kelp-cubes",
    kind: "regular",
    title: "Kelp Cubes: Familiar Words",
    description: "Guide Tile Rays away by reading familiar words carefully.",
    lessonLabel: "Today: familiar words from left to right",
    labels: KELP_SIGHT_WORDS,
    difficulty: "standard",
    durationMs: 105_000,
    targetFamilies: ["tile-ray", "treasure-bubble"],
    unlock: { allOf: ["sunlit-gate"] },
    buildReward: "kelp garden bed",
  },
  {
    id: "kelp-shellback",
    region: "kelp-cubes",
    kind: "regular",
    title: "Kelp Cubes: Next Word",
    description: "Finish each Shellback label, then calmly read its next word.",
    lessonLabel: "Today: two short words, one careful step at a time",
    labels: KELP_PAIR_WORDS,
    difficulty: "standard",
    durationMs: 120_000,
    targetFamilies: ["shellback", "treasure-bubble"],
    unlock: { allOf: ["kelp-sight-words"] },
    buildReward: "mossy bridge",
  },
  {
    id: "kelp-word-pairs",
    region: "kelp-cubes",
    kind: "regular",
    title: "Kelp Cubes: Word Pairs",
    description: "Keep your focus on one Shellback until both small labels are complete.",
    lessonLabel: "Today: finish one word, then find the next",
    labels: STANDARD_FAMILIAR_WORDS,
    difficulty: "standard",
    durationMs: 120_000,
    targetFamilies: ["shellback", "treasure-bubble"],
    unlock: { allOf: ["kelp-sight-words"] },
    buildReward: "reef builder dock",
  },
  {
    id: "kelp-gate",
    region: "kelp-cubes",
    kind: "current-gate",
    title: "Kelp Gate",
    description: "Redirect short word cubes to steady the Kelp Gate.",
    lessonLabel: "Today: short labels with a steady rhythm",
    labels: STARTER_CVC_WORDS,
    difficulty: "standard",
    durationMs: 120_000,
    targetFamilies: ["current-gate"],
    unlock: {
      allOf: ["kelp-sight-words"],
      anyOf: ["kelp-shellback", "kelp-word-pairs"],
    },
    gate: { stabilityBlocks: 10, maximumVisibleProjectiles: 3 },
  },
  {
    id: "crystal-prism-words",
    region: "crystal-current",
    kind: "regular",
    title: "Crystal Current: Prism Words",
    description: "Read each Prism Eel label while its crystal pattern gently shifts.",
    lessonLabel: "Today: clear 3–5 letter reef words",
    labels: STANDARD_FAMILIAR_WORDS,
    difficulty: "standard",
    durationMs: 120_000,
    targetFamilies: ["prism-eel", "treasure-bubble"],
    unlock: { allOf: ["kelp-gate"] },
    buildReward: "violet crystal lamp",
  },
  {
    id: "crystal-spark-school",
    region: "crystal-current",
    kind: "regular",
    title: "Crystal Current: Spark School",
    description: "Take your time choosing the next bright letter in the Spark School.",
    lessonLabel: "Today: choose the next letter accurately",
    labels: ALL_LETTERS,
    difficulty: "starter",
    durationMs: 90_000,
    targetFamilies: ["spark-school", "treasure-bubble"],
    unlock: { allOf: ["crystal-prism-words"] },
    buildReward: "crystal stepping stones",
  },
  {
    id: "crystal-swift-current",
    region: "crystal-current",
    kind: "regular",
    title: "Crystal Current: Swift Words",
    description: "Use your careful reading in a livelier crystal current.",
    lessonLabel: "Today: longer familiar words",
    labels: SWIFT_CHALLENGE_WORDS,
    difficulty: "swift",
    durationMs: 150_000,
    targetFamilies: ["prism-eel", "treasure-bubble"],
    unlock: { allOf: ["crystal-prism-words"] },
    buildReward: "current compass tower",
  },
  {
    id: "crystal-gate",
    region: "crystal-current",
    kind: "current-gate",
    title: "Crystal Gate",
    description: "Redirect the crystal word cubes and settle the final Current Gate.",
    lessonLabel: "Today: patient, accurate word reading",
    labels: STANDARD_FAMILIAR_WORDS,
    difficulty: "standard",
    durationMs: 120_000,
    targetFamilies: ["current-gate"],
    unlock: {
      allOf: ["crystal-prism-words"],
      anyOf: ["crystal-spark-school", "crystal-swift-current"],
    },
    gate: { stabilityBlocks: 12, maximumVisibleProjectiles: 3 },
  },
];

export function isMissionUnlocked(
  mission: MissionDefinition,
  completedMissionIds: ReadonlySet<string>,
): boolean {
  const allComplete = (mission.unlock.allOf ?? []).every((id) => completedMissionIds.has(id));
  const anyRequired = mission.unlock.anyOf;
  const oneBranchComplete = !anyRequired || anyRequired.some((id) => completedMissionIds.has(id));
  return allComplete && oneBranchComplete;
}

/** Validate editorial mistakes before a mission reaches a child-facing map. */
export function validateMissions(missions: readonly MissionDefinition[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const mission of missions) {
    if (ids.has(mission.id)) issues.push(`duplicate mission id "${mission.id}"`);
    ids.add(mission.id);
    if (mission.labels.length === 0) issues.push(`mission "${mission.id}" has no labels`);
    if (mission.kind === "current-gate" && !mission.gate) {
      issues.push(`gate mission "${mission.id}" has no gate configuration`);
    }
    if (mission.kind === "regular" && mission.gate) {
      issues.push(`regular mission "${mission.id}" has gate configuration`);
    }
    if (mission.gate && mission.gate.maximumVisibleProjectiles > 3) {
      issues.push(`gate mission "${mission.id}" exceeds three visible projectiles`);
    }
    for (const dependency of [...(mission.unlock.allOf ?? []), ...(mission.unlock.anyOf ?? [])]) {
      if (!missions.some((candidate) => candidate.id === dependency)) {
        issues.push(`mission "${mission.id}" references missing prerequisite "${dependency}"`);
      }
    }
  }
  return issues;
}

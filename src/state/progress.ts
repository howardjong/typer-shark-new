import { isMissionUnlocked, MISSIONS } from "../game/missions";
import { readJson, writeJson, StorageLike } from "./storage";

export const PROGRESS_KEY = "blockReef.progress.v1";

export interface MissionBest {
  accuracy: number | null;
  wpm: number | null;
  stars: 0 | 1 | 2 | 3;
  bestStreak: number;
}

export interface Progress {
  /** Completed campaign lessons; never removed by a later unsuccessful retry. */
  completedMissions: string[];
  /** Derived and persisted for fast, inspectable map rendering. */
  unlockedMissionIds: string[];
  best: Record<string, MissionBest>;
  buildBits: number;
  /** Cosmetic, non-random pieces placed into Pebble Bay. */
  buildPieces: string[];
  bestDeepCurrentDistance: number;
}

export const DEFAULT_PROGRESS: Progress = {
  completedMissions: [],
  unlockedMissionIds: ["warmup-first-letter"],
  best: {},
  buildBits: 0,
  buildPieces: [],
  bestDeepCurrentDistance: 0,
};

/** Deep Current becomes available after four durable Adventure Trail completions. */
export function isDeepCurrentUnlocked(progress: Pick<Progress, "completedMissions">): boolean {
  const knownMissionIds = new Set<string>(MISSIONS.map((mission) => mission.id));
  return new Set(progress.completedMissions.filter((id) => knownMissionIds.has(id))).size >= 4;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0))];
}

function finiteWhole(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function starsForAccuracy(accuracy: number | null): 0 | 1 | 2 | 3 {
  if (accuracy === null) return 0;
  if (accuracy >= 95) return 3;
  if (accuracy >= 85) return 2;
  if (accuracy >= 70) return 1;
  return 0;
}

/** Recomputes campaign availability so corrupt or stale storage cannot lock a child out. */
export function unlockedMissionIdsFor(completedMissions: readonly string[]): string[] {
  const completed = new Set(completedMissions);
  return MISSIONS
    .filter((mission) => isMissionUnlocked(mission, completed))
    .map((mission) => mission.id);
}

export function sanitizeProgress(raw: unknown): Progress {
  const d = DEFAULT_PROGRESS;
  if (typeof raw !== "object" || raw === null) return structuredCloneSafe(d);
  const r = raw as Record<string, unknown>;

  const completedMissions = uniqueStrings(r.completedMissions);
  const best: Record<string, MissionBest> = {};
  if (typeof r.best === "object" && r.best !== null) {
    for (const [id, value] of Object.entries(r.best as Record<string, unknown>)) {
      if (typeof value !== "object" || value === null) continue;
      const v = value as Record<string, unknown>;
      const accuracy = typeof v.accuracy === "number" && Number.isFinite(v.accuracy)
        ? v.accuracy
        : null;
      const wpm = typeof v.wpm === "number" && Number.isFinite(v.wpm) ? v.wpm : null;
      const hasStoredStars = typeof v.stars === "number" && Number.isFinite(v.stars);
      best[id] = {
        accuracy,
        wpm,
        stars: hasStoredStars
          ? Math.min(3, finiteWhole(v.stars)) as 0 | 1 | 2 | 3
          : starsForAccuracy(accuracy),
        bestStreak: finiteWhole(v.bestStreak),
      };
    }
  }

  return {
    completedMissions,
    // Intentionally ignore stored unlocks: they are always derived from
    // durable completion data and the current mission topology.
    unlockedMissionIds: unlockedMissionIdsFor(completedMissions),
    best,
    buildBits: finiteWhole(r.buildBits),
    buildPieces: uniqueStrings(r.buildPieces),
    bestDeepCurrentDistance: finiteWhole(r.bestDeepCurrentDistance),
  };
}

function structuredCloneSafe(progress: Progress): Progress {
  return {
    completedMissions: [...progress.completedMissions],
    unlockedMissionIds: [...progress.unlockedMissionIds],
    best: Object.fromEntries(
      Object.entries(progress.best).map(([id, result]) => [id, { ...result }]),
    ),
    buildBits: progress.buildBits,
    buildPieces: [...progress.buildPieces],
    bestDeepCurrentDistance: progress.bestDeepCurrentDistance,
  };
}

export function loadProgress(storage: StorageLike): Progress {
  return sanitizeProgress(readJson(storage, PROGRESS_KEY));
}

export function saveProgress(storage: StorageLike, progress: Progress): boolean {
  return writeJson(storage, PROGRESS_KEY, progress);
}

export interface MissionResultToRecord {
  success: boolean;
  accuracy: number | null;
  wpm: number | null;
  buildBits: number;
  bestStreak?: number;
  buildPiece?: string;
}

/** Merge a finished mission into progress, preserving a child's personal bests. */
export function recordMissionResult(
  progress: Progress,
  missionId: string,
  result: MissionResultToRecord,
): Progress {
  const next = structuredCloneSafe(progress);
  next.buildBits += finiteWhole(result.buildBits);
  if (result.success && !next.completedMissions.includes(missionId)) {
    next.completedMissions.push(missionId);
  }
  if (result.success && result.buildPiece && !next.buildPieces.includes(result.buildPiece)) {
    next.buildPieces.push(result.buildPiece);
  }

  const previous = next.best[missionId] ?? {
    accuracy: null,
    wpm: null,
    stars: 0 as const,
    bestStreak: 0,
  };
  next.best[missionId] = {
    accuracy:
      result.accuracy !== null && (previous.accuracy === null || result.accuracy > previous.accuracy)
        ? result.accuracy
        : previous.accuracy,
    wpm:
      result.wpm !== null && (previous.wpm === null || result.wpm > previous.wpm)
        ? result.wpm
        : previous.wpm,
    stars: Math.max(previous.stars, starsForAccuracy(result.accuracy)) as 0 | 1 | 2 | 3,
    bestStreak: Math.max(previous.bestStreak, finiteWhole(result.bestStreak)),
  };
  next.unlockedMissionIds = unlockedMissionIdsFor(next.completedMissions);
  return next;
}

/** Deep Current has its own distance best and never changes campaign progression. */
export function recordDeepCurrentDistance(progress: Progress, distance: number): Progress {
  const next = structuredCloneSafe(progress);
  next.bestDeepCurrentDistance = Math.max(next.bestDeepCurrentDistance, finiteWhole(distance));
  return next;
}

/** Build Break awards only its explicit bonus; it never alters lesson progress or bests. */
export function recordBuildBreakReward(progress: Progress, buildBits: number): Progress {
  const next = structuredCloneSafe(progress);
  next.buildBits += finiteWhole(buildBits);
  return next;
}

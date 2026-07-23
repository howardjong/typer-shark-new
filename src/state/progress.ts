import { readJson, writeJson, StorageLike } from "./storage";

export const PROGRESS_KEY = "blockReef.progress.v1";

export interface MissionBest {
  accuracy: number | null;
  wpm: number | null;
}

export interface Progress {
  completedMissions: string[];
  best: Record<string, MissionBest>;
  buildBits: number;
}

export const DEFAULT_PROGRESS: Progress = {
  completedMissions: [],
  best: {},
  buildBits: 0,
};

export function sanitizeProgress(raw: unknown): Progress {
  const d = DEFAULT_PROGRESS;
  if (typeof raw !== "object" || raw === null) return structuredCloneSafe(d);
  const r = raw as Record<string, unknown>;

  const completedMissions = Array.isArray(r.completedMissions)
    ? r.completedMissions.filter((m): m is string => typeof m === "string")
    : [];

  const best: Record<string, MissionBest> = {};
  if (typeof r.best === "object" && r.best !== null) {
    for (const [id, value] of Object.entries(r.best as Record<string, unknown>)) {
      if (typeof value !== "object" || value === null) continue;
      const v = value as Record<string, unknown>;
      best[id] = {
        accuracy: typeof v.accuracy === "number" ? v.accuracy : null,
        wpm: typeof v.wpm === "number" ? v.wpm : null,
      };
    }
  }

  const buildBits =
    typeof r.buildBits === "number" && r.buildBits >= 0 && Number.isFinite(r.buildBits)
      ? Math.floor(r.buildBits)
      : 0;

  return { completedMissions, best, buildBits };
}

function structuredCloneSafe(p: Progress): Progress {
  return { completedMissions: [...p.completedMissions], best: { ...p.best }, buildBits: p.buildBits };
}

export function loadProgress(storage: StorageLike): Progress {
  return sanitizeProgress(readJson(storage, PROGRESS_KEY));
}

export function saveProgress(storage: StorageLike, progress: Progress): boolean {
  return writeJson(storage, PROGRESS_KEY, progress);
}

/** Merge a finished mission into progress, keeping best results. */
export function recordMissionResult(
  progress: Progress,
  missionId: string,
  result: { success: boolean; accuracy: number | null; wpm: number | null; buildBits: number },
): Progress {
  const next = structuredCloneSafe(progress);
  next.buildBits += result.buildBits;
  if (result.success && !next.completedMissions.includes(missionId)) {
    next.completedMissions.push(missionId);
  }
  const prev = next.best[missionId] ?? { accuracy: null, wpm: null };
  next.best[missionId] = {
    accuracy:
      result.accuracy !== null && (prev.accuracy === null || result.accuracy > prev.accuracy)
        ? result.accuracy
        : prev.accuracy,
    wpm:
      result.wpm !== null && (prev.wpm === null || result.wpm > prev.wpm)
        ? result.wpm
        : prev.wpm,
  };
  return next;
}

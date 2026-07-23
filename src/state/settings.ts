import type { MotionId } from "../game/config";
import { readJson, writeJson, StorageLike } from "./storage";

export const SETTINGS_KEY = "blockReef.settings.v1";

export interface Settings {
  textSize: "default" | "large";
  contrast: "standard" | "extra";
  motion: MotionId;
  masterVolume: number; // 0..1
  sfxVolume: number;
  musicVolume: number;
  captions: boolean;
  reducedFeedback: boolean;
  noSameFirstLetter: boolean;
  pauseReminderMin: 0 | 5 | 10 | 15;
}

export const DEFAULT_SETTINGS: Settings = {
  textSize: "default",
  contrast: "standard",
  motion: "normal",
  masterVolume: 0.6,
  sfxVolume: 0.7,
  musicVolume: 0.4,
  captions: false,
  reducedFeedback: false,
  noSameFirstLetter: true,
  pauseReminderMin: 10,
};

function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function volume(value: unknown, fallback: number): number {
  return typeof value === "number" && value >= 0 && value <= 1 ? value : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Field-by-field validation so old/corrupt data degrades to safe defaults. */
export function sanitizeSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  if (typeof raw !== "object" || raw === null) return { ...d };
  const r = raw as Record<string, unknown>;
  return {
    textSize: oneOf(r.textSize, ["default", "large"] as const, d.textSize),
    contrast: oneOf(r.contrast, ["standard", "extra"] as const, d.contrast),
    motion: oneOf(r.motion, ["slow", "normal", "fast"] as const, d.motion),
    masterVolume: volume(r.masterVolume, d.masterVolume),
    sfxVolume: volume(r.sfxVolume, d.sfxVolume),
    musicVolume: volume(r.musicVolume, d.musicVolume),
    captions: bool(r.captions, d.captions),
    reducedFeedback: bool(r.reducedFeedback, d.reducedFeedback),
    noSameFirstLetter: bool(r.noSameFirstLetter, d.noSameFirstLetter),
    pauseReminderMin: oneOf(r.pauseReminderMin, [0, 5, 10, 15] as const, d.pauseReminderMin),
  };
}

export function loadSettings(storage: StorageLike): Settings {
  return sanitizeSettings(readJson(storage, SETTINGS_KEY));
}

export function saveSettings(storage: StorageLike, settings: Settings): boolean {
  return writeJson(storage, SETTINGS_KEY, settings);
}

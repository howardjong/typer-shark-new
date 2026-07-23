import { describe, expect, it } from "vitest";
import { readJson, writeJson, StorageLike } from "../src/state/storage";
import { DEFAULT_SETTINGS, loadSettings, sanitizeSettings, saveSettings, SETTINGS_KEY } from "../src/state/settings";
import { DEFAULT_PROGRESS, loadProgress, recordMissionResult, sanitizeProgress } from "../src/state/progress";

class FakeStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
}

class BrokenStorage implements StorageLike {
  getItem(): string | null {
    throw new Error("storage disabled");
  }
  setItem(): void {
    throw new Error("storage full");
  }
}

describe("safe storage helpers", () => {
  it("returns null for corrupt JSON instead of throwing", () => {
    const s = new FakeStorage();
    s.setItem("k", "{not json!");
    expect(readJson(s, "k")).toBeNull();
  });
  it("survives a throwing storage on both read and write", () => {
    const s = new BrokenStorage();
    expect(readJson(s, "k")).toBeNull();
    expect(writeJson(s, "k", { a: 1 })).toBe(false);
  });
});

describe("settings persistence", () => {
  it("loads defaults when nothing is stored", () => {
    expect(loadSettings(new FakeStorage())).toEqual(DEFAULT_SETTINGS);
  });
  it("round-trips valid settings", () => {
    const s = new FakeStorage();
    const custom = { ...DEFAULT_SETTINGS, textSize: "large" as const, motion: "slow" as const };
    saveSettings(s, custom);
    expect(loadSettings(s)).toEqual(custom);
  });
  it("sanitizes corrupt/partial/hostile data field by field", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings("junk")).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ textSize: "enormous", masterVolume: 99, pauseReminderMin: 7 })).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ textSize: "large" }).textSize).toBe("large");
  });
  it("keeps the game playable with corrupt stored JSON", () => {
    const s = new FakeStorage();
    s.setItem(SETTINGS_KEY, "]]]corrupt");
    expect(loadSettings(s)).toEqual(DEFAULT_SETTINGS);
  });
});

describe("progress persistence", () => {
  it("loads defaults when nothing is stored", () => {
    expect(loadProgress(new FakeStorage())).toEqual(DEFAULT_PROGRESS);
  });
  it("sanitizes hostile data", () => {
    const p = sanitizeProgress({ completedMissions: [1, "ok", null], buildBits: -5, best: { m: { accuracy: "no" } } });
    expect(p.completedMissions).toEqual(["ok"]);
    expect(p.buildBits).toBe(0);
    expect(p.best.m.accuracy).toBeNull();
  });
  it("records mission results keeping bests", () => {
    let p = DEFAULT_PROGRESS;
    p = recordMissionResult(p, "m1", { success: true, accuracy: 80, wpm: 10, buildBits: 40 });
    p = recordMissionResult(p, "m1", { success: true, accuracy: 70, wpm: 15, buildBits: 20 });
    expect(p.best.m1).toEqual({ accuracy: 80, wpm: 15 });
    expect(p.buildBits).toBe(60);
    expect(p.completedMissions).toEqual(["m1"]);
  });
  it("a failed attempt never removes completion", () => {
    let p = recordMissionResult(DEFAULT_PROGRESS, "m1", { success: true, accuracy: 90, wpm: 12, buildBits: 10 });
    p = recordMissionResult(p, "m1", { success: false, accuracy: 50, wpm: null, buildBits: 5 });
    expect(p.completedMissions).toEqual(["m1"]);
  });
});

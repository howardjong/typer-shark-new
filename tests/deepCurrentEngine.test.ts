import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../src/game/config";
import { DEEP_CURRENT_BREATHER_MS, DeepCurrentEngine, deepCurrentPace } from "../src/game/deepCurrentEngine";
import { HOME_ROW_LETTERS, STARTER_CVC_WORDS } from "../src/game/wordBanks";

describe("Deep Current pacing", () => {
  it("uses transparent word-length tiers and never exceeds the selected spawn floor", () => {
    const starterStart = deepCurrentPace(DIFFICULTIES.starter, 0);
    const starterLater = deepCurrentPace(DIFFICULTIES.starter, 150_000);
    expect(starterStart.labels).toBe(HOME_ROW_LETTERS);
    expect(starterLater.labels).toBe(STARTER_CVC_WORDS);
    expect(starterStart.minSpawnIntervalMs).toBeGreaterThanOrEqual(DIFFICULTIES.starter.minSpawnIntervalMs);
    expect(starterLater.minSpawnIntervalMs).toBe(DIFFICULTIES.starter.minSpawnIntervalMs);

    const standardStart = deepCurrentPace(DIFFICULTIES.standard, 0);
    const standardLater = deepCurrentPace(DIFFICULTIES.standard, 60_000);
    expect(standardStart.labels.every((label) => label.length <= 3)).toBe(true);
    expect(standardLater.labels.every((label) => label.length <= 5)).toBe(true);
    expect(standardLater.minSpawnIntervalMs).toBeGreaterThanOrEqual(DIFFICULTIES.standard.minSpawnIntervalMs);
  });

  it("stops for the required breather without exceeding the normal target cap", () => {
    const current = new DeepCurrentEngine({
      difficulty: DIFFICULTIES.starter,
      motion: "normal",
      seed: 5,
      breatherEveryMs: 200,
    });
    let result: ReturnType<DeepCurrentEngine["tick"]> = "ok";
    for (let i = 0; i < 5; i++) {
      result = current.tick(50);
      expect(current.targets.length).toBeLessThanOrEqual(DIFFICULTIES.starter.maxVisibleTargets);
      if (result === "breather") break;
    }
    expect(result).toBe("breather");
    expect(current.drainEvents()).toContainEqual({ type: "breather", distance: 0 });
    expect(DEEP_CURRENT_BREATHER_MS).toBe(60_000);
  });
});

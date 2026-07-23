import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../src/game/config";
import { Engine } from "../src/game/engine";
import { STARTER_WARMUP_LETTERS, validateLetterBank, ALL_LETTERS } from "../src/game/wordBanks";

describe("word banks", () => {
  it("warm-up bank is valid", () => {
    expect(validateLetterBank(STARTER_WARMUP_LETTERS)).toEqual([]);
  });
  it("full letter bank is valid", () => {
    expect(validateLetterBank(ALL_LETTERS)).toEqual([]);
  });
  it("validation catches duplicates, case, and length problems", () => {
    expect(validateLetterBank(["a", "a"]).length).toBeGreaterThan(0);
    expect(validateLetterBank(["A"]).length).toBeGreaterThan(0);
    expect(validateLetterBank(["ab"]).length).toBeGreaterThan(0);
    expect(validateLetterBank([]).length).toBeGreaterThan(0);
  });
});

describe("starter mission generator", () => {
  it("never shows two targets with the same first letter in Starter mode", () => {
    const engine = new Engine({
      difficulty: DIFFICULTIES.starter,
      motion: "normal",
      letters: STARTER_WARMUP_LETTERS,
      seed: 7,
      durationMs: 70000,
    });
    for (let i = 0; i < 1300 && !engine.ended; i++) {
      engine.tick(50);
      const firsts = engine.targets.map((t) => t.label[0]);
      expect(new Set(firsts).size).toBe(firsts.length);
    }
  });

  it("respects the max visible target cap", () => {
    const engine = new Engine({
      difficulty: DIFFICULTIES.starter,
      motion: "normal",
      letters: STARTER_WARMUP_LETTERS,
      seed: 3,
      durationMs: 70000,
    });
    for (let i = 0; i < 1300 && !engine.ended; i++) {
      engine.tick(50);
      expect(engine.targets.length).toBeLessThanOrEqual(
        DIFFICULTIES.starter.maxVisibleTargets,
      );
    }
  });

  it("terminates (delays spawn) when the pool is fully constrained, never loops forever", () => {
    // Pool of exactly one letter: after one target is visible, the pool for a
    // second is empty — the engine must simply delay, not hang or crash.
    const engine = new Engine({
      difficulty: DIFFICULTIES.starter,
      motion: "normal",
      letters: ["a"],
      seed: 5,
      durationMs: 60000,
    });
    for (let i = 0; i < 600; i++) engine.tick(50);
    expect(engine.targets.length).toBeLessThanOrEqual(1);
  });

  it("is deterministic for a given seed", () => {
    const run = () => {
      const engine = new Engine({
        difficulty: DIFFICULTIES.starter,
        motion: "normal",
        letters: STARTER_WARMUP_LETTERS,
        seed: 99,
        durationMs: 60000,
      });
      const labels: string[] = [];
      for (let i = 0; i < 800; i++) {
        engine.tick(50);
        for (const e of engine.drainEvents()) {
          if (e.type === "spawn") labels.push(`${e.target.label}:${e.target.lane}`);
        }
      }
      return labels.join(",");
    };
    expect(run()).toBe(run());
  });

  it("spawns no faster than the difficulty ceiling", () => {
    const engine = new Engine({
      difficulty: DIFFICULTIES.starter,
      motion: "normal",
      letters: STARTER_WARMUP_LETTERS,
      seed: 11,
      durationMs: 70000,
    });
    const spawnTimes: number[] = [];
    let sim = 0;
    for (let i = 0; i < 1300 && !engine.ended; i++) {
      engine.tick(50);
      sim += 50;
      for (const e of engine.drainEvents()) {
        if (e.type === "spawn") spawnTimes.push(sim);
      }
      // Clear targets so spawn slots stay open (typing them away).
      for (const t of [...engine.targets]) engine.handleKey(t.label[0]);
    }
    for (let i = 1; i < spawnTimes.length; i++) {
      expect(spawnTimes[i] - spawnTimes[i - 1]).toBeGreaterThanOrEqual(
        DIFFICULTIES.starter.minSpawnIntervalMs - 50,
      );
    }
  });
});

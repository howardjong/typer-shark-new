import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../src/game/config";
import { Engine } from "../src/game/engine";
import {
  ALL_LETTERS,
  BOTTOM_ROW_LETTERS,
  COMMON_SIGHT_WORDS,
  HOME_ROW_LETTERS,
  SIGHT_WORD_RULES,
  STANDARD_FAMILIAR_WORDS,
  STANDARD_WORD_RULES,
  STARTER_CVC_RULES,
  STARTER_CVC_WORDS,
  STARTER_WARMUP_LETTERS,
  SWIFT_CHALLENGE_WORDS,
  SWIFT_WORD_RULES,
  TOP_ROW_LETTERS,
  validateLetterBank,
  validateWordBank,
} from "../src/game/wordBanks";

describe("word banks", () => {
  it("warm-up bank is valid", () => {
    expect(validateLetterBank(STARTER_WARMUP_LETTERS)).toEqual([]);
  });
  it("full letter bank is valid", () => {
    expect(validateLetterBank(ALL_LETTERS)).toEqual([]);
  });
  it("keeps each required letter drill bank valid", () => {
    expect(validateLetterBank(HOME_ROW_LETTERS)).toEqual([]);
    expect(validateLetterBank(TOP_ROW_LETTERS)).toEqual([]);
    expect(validateLetterBank(BOTTOM_ROW_LETTERS)).toEqual([]);
  });
  it("validation catches duplicates, case, and length problems", () => {
    expect(validateLetterBank(["a", "a"]).length).toBeGreaterThan(0);
    expect(validateLetterBank(["A"]).length).toBeGreaterThan(0);
    expect(validateLetterBank(["ab"]).length).toBeGreaterThan(0);
    expect(validateLetterBank([]).length).toBeGreaterThan(0);
  });

  it("keeps every reviewed word bank suitable for its difficulty", () => {
    expect(validateWordBank(STARTER_CVC_WORDS, STARTER_CVC_RULES)).toEqual([]);
    expect(validateWordBank(COMMON_SIGHT_WORDS, SIGHT_WORD_RULES)).toEqual([]);
    expect(validateWordBank(STANDARD_FAMILIAR_WORDS, STANDARD_WORD_RULES)).toEqual([]);
    expect(validateWordBank(SWIFT_CHALLENGE_WORDS, SWIFT_WORD_RULES)).toEqual([]);
  });

  it("rejects punctuation, empty labels, invalid lengths, and weak variety", () => {
    const rules = { minEntries: 3, minLength: 3, maxLength: 4, minDistinctFirstLetters: 3 };
    expect(validateWordBank(["cat", "dog", "sun!"], rules).length).toBeGreaterThan(0);
    expect(validateWordBank(["cat", "", "dog"], rules).length).toBeGreaterThan(0);
    expect(validateWordBank(["a", "bee", "dog"], rules).length).toBeGreaterThan(0);
    expect(validateWordBank(["cat", "cap", "can"], rules).length).toBeGreaterThan(0);
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

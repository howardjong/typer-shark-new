import { describe, expect, it } from "vitest";
import { DIFFICULTIES } from "../src/game/config";
import { Engine, EngineEvent } from "../src/game/engine";
import { STARTER_WARMUP_LETTERS } from "../src/game/wordBanks";

function makeEngine(overrides: Partial<ConstructorParameters<typeof Engine>[0]> = {}) {
  return new Engine({
    difficulty: DIFFICULTIES.starter,
    motion: "normal",
    letters: STARTER_WARMUP_LETTERS,
    seed: 42,
    ...overrides,
  });
}

/** Advance until at least n targets exist (bounded). */
function spawnTargets(engine: Engine, n: number, maxMs = 60000): void {
  let elapsed = 0;
  while (engine.targets.length < n && elapsed < maxMs) {
    engine.tick(50);
    elapsed += 50;
  }
  if (engine.targets.length < n) throw new Error("could not spawn enough targets");
}

describe("target selection", () => {
  it("first typed char selects the eligible target closest to the base and counts as the first correct char", () => {
    const engine = makeEngine();
    spawnTargets(engine, 2);
    // Manually position: give two targets distinct letters and x.
    engine.targets[0].label = "f";
    engine.targets[0].x = 0.3;
    engine.targets[1].label = "j";
    engine.targets[1].x = 0.8;

    engine.handleKey("j");
    // Single-letter labels complete immediately: selection clears, and the
    // keystroke counted as both the selection and the first correct char.
    expect(engine.selectedId).toBeNull();
    expect(engine.correct).toBe(1);
    expect(engine.accepted).toBe(1);
    expect(engine.completed).toBe(1);
  });

  it("selects the nearest of two eligible targets", () => {
    const engine = makeEngine();
    spawnTargets(engine, 2);
    const [a, b] = engine.targets;
    a.label = "s";
    a.x = 0.9;
    b.label = "s";
    b.x = 0.2; // closer to base
    engine.handleKey("s");
    // Nearest one (b) completed; a remains.
    expect(engine.targets.map((t) => t.id)).toContain(a.id);
    expect(engine.targets.map((t) => t.id)).not.toContain(b.id);
  });

  it("breaks exact distance ties by earlier spawn time then id", () => {
    const engine = makeEngine();
    spawnTargets(engine, 2);
    const [a, b] = engine.targets;
    a.label = "d";
    b.label = "d";
    a.x = 0.5;
    b.x = 0.5;
    a.spawnTime = 100;
    b.spawnTime = 200;
    engine.handleKey("d");
    expect(engine.targets.map((t) => t.id)).not.toContain(a.id);
    expect(engine.targets.map((t) => t.id)).toContain(b.id);
  });

  it("keeps the selected target locked; a closer target cannot steal focus", () => {
    const engine = makeEngine({ letters: ["a", "b"] as const });
    spawnTargets(engine, 2);
    const [a, b] = engine.targets;
    a.label = "ab"; // two chars so selection persists
    a.x = 0.8;
    b.label = "bb";
    b.x = 0.2;
    engine.handleKey("a"); // selects a despite b being closer (b doesn't match)
    expect(engine.selectedId).toBe(a.id);
    // 'b' now matches BOTH a's next char and b's first char — must advance a.
    engine.handleKey("b");
    expect(engine.completed).toBe(1); // a completed
    expect(engine.targets.map((t) => t.id)).toContain(b.id);
  });
});

describe("input handling", () => {
  it("wrong key on a selected target preserves typed progress and resets only the streak", () => {
    const engine = makeEngine();
    spawnTargets(engine, 1);
    const t = engine.targets[0];
    t.label = "as";
    engine.streak = 3;
    engine.handleKey("a");
    expect(t.typed).toBe(1);
    engine.handleKey("x"); // wrong
    expect(t.typed).toBe(1); // progress preserved
    expect(engine.streak).toBe(0);
    expect(engine.accepted).toBe(2);
    expect(engine.correct).toBe(1);
  });

  it("a key matching no target counts as an accepted (incorrect) keystroke", () => {
    const engine = makeEngine();
    spawnTargets(engine, 1);
    engine.targets[0].label = "f";
    engine.handleKey("z");
    expect(engine.accepted).toBe(1);
    expect(engine.correct).toBe(0);
    const events = engine.drainEvents().filter((e) => e.type === "noMatch");
    expect(events).toHaveLength(1);
  });

  it("ignores input after the mission has ended", () => {
    const engine = makeEngine({ durationMs: 100 });
    engine.tick(99);
    engine.tick(50); // timer reaches zero -> success
    expect(engine.ended).toBe("success");
    engine.handleKey("a");
    expect(engine.accepted).toBe(0);
  });
});

describe("collisions and hearts", () => {
  it("a selected target reaching the base costs one heart once, clears selection, and is not a typing mistake", () => {
    const engine = makeEngine({ letters: ["a"] as const });
    spawnTargets(engine, 1);
    const t = engine.targets[0];
    t.label = "aa";
    engine.handleKey("a"); // select + progress
    expect(engine.selectedId).toBe(t.id);
    const acceptedBefore = engine.accepted;
    t.x = 0.0001;
    engine.tick(50);
    expect(engine.hearts).toBe(DIFFICULTIES.starter.hearts - 1);
    expect(engine.selectedId).toBeNull();
    expect(engine.targets).toHaveLength(0);
    expect(engine.accepted).toBe(acceptedBefore); // no phantom keystroke
    // Typing afterwards must not hit a stale object.
    engine.handleKey("a");
    expect(engine.correct).toBe(1); // only the earlier correct one
  });

  it("final keystroke wins a same-update collision (keystroke handled before tick)", () => {
    const engine = makeEngine();
    spawnTargets(engine, 1);
    const t = engine.targets[0];
    t.label = "f";
    t.x = 0.0000001; // will collide on next tick
    engine.handleKey("f"); // completes first
    expect(engine.completed).toBe(1);
    engine.tick(16);
    expect(engine.hearts).toBe(DIFFICULTIES.starter.hearts); // no heart lost
  });

  it("zero hearts ends the mission in defeat", () => {
    const engine = makeEngine();
    spawnTargets(engine, 1);
    for (let i = 0; i < DIFFICULTIES.starter.hearts; i++) {
      spawnTargets(engine, 1);
      engine.targets[0].x = 0.00001;
      engine.tick(20);
    }
    expect(engine.ended).toBe("defeat");
    expect(engine.targets).toHaveLength(0);
  });
});

describe("timing safety", () => {
  it("clamps a long-but-normal frame delta to 100ms", () => {
    const engine = makeEngine();
    const before = engine.timeLeftMs;
    engine.tick(400); // clamped to 100
    expect(before - engine.timeLeftMs).toBe(100);
  });

  it("returns 'stall' without simulating when the gap exceeds 500ms", () => {
    const engine = makeEngine();
    const before = engine.timeLeftMs;
    const result = engine.tick(1500);
    expect(result).toBe("stall");
    expect(engine.timeLeftMs).toBe(before); // no time advanced
    expect(engine.activeMs).toBe(0);
  });

  it("mission timer reaching zero is success and clears targets without stat side effects", () => {
    const engine = makeEngine({ durationMs: 5000 });
    spawnTargets(engine, 1);
    const correctBefore = engine.correct;
    const bitsBefore = engine.buildBits;
    for (let i = 0; i < 200 && !engine.ended; i++) engine.tick(100);
    expect(engine.ended).toBe("success");
    expect(engine.targets).toHaveLength(0);
    expect(engine.correct).toBe(correctBefore);
    expect(engine.buildBits).toBe(bitsBefore);
  });
});

describe("streaks and rewards", () => {
  it("awards a badge every five consecutive completions and resets streak on a mistake", () => {
    const engine = makeEngine({ letters: ["a", "b", "c", "d", "e", "f", "g"] as const, durationMs: 600000 });
    let badges = 0;
    for (let i = 0; i < 5; i++) {
      spawnTargets(engine, 1);
      engine.handleKey(engine.targets[0].label[0]);
      const events = engine.drainEvents();
      badges += events.filter((e): e is Extract<EngineEvent, { type: "complete" }> => e.type === "complete").filter((e) => e.badge).length;
    }
    expect(badges).toBe(1);
    expect(engine.streak).toBe(5);
    engine.handleKey("z"); // mistake
    expect(engine.streak).toBe(0);
    expect(engine.bestStreak).toBe(5);
  });
});

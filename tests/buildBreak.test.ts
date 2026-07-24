import { describe, expect, it } from "vitest";
import { buildBreakBonus } from "../src/components/BuildBreakScreen";
import { initialState, reduce } from "../src/state/machine";
import { DEFAULT_PROGRESS, recordBuildBreakReward } from "../src/state/progress";

describe("Build Break", () => {
  it("reduces only the optional bonus when keys are missed", () => {
    expect(buildBreakBonus(5, 0)).toBe(10);
    expect(buildBreakBonus(5, 3)).toBe(7);
    expect(buildBreakBonus(1, 9)).toBe(0);
  });

  it("never changes campaign completion when awarding its bonus", () => {
    const progress = recordBuildBreakReward(DEFAULT_PROGRESS, 12);
    expect(progress.buildBits).toBe(12);
    expect(progress.completedMissions).toEqual([]);
    expect(progress.buildPieces).toEqual([]);
  });

  it("is offered only after a successful timed mission and returns to the map", () => {
    let state = reduce(initialState, { type: "PLAY" });
    state = reduce(state, { type: "KEYBOARD_OK" });
    state = reduce(state, { type: "PICK_DIFFICULTY", difficulty: "starter" });
    state = reduce(state, { type: "SELECT_MISSION", missionId: "warmup-first-letter", runPolicy: "timed" });
    state = reduce(state, { type: "START_MISSION" });
    state = reduce(state, {
      type: "MISSION_END",
      outcome: "success",
      stats: {
        hearts: 3, timeLeftMs: 0, activeMs: 60_000, correct: 9, accepted: 10,
        streak: 2, bestStreak: 3, completed: 4, buildBits: 20,
        shieldCharge: 1, shieldReady: false, ended: "success",
      },
    });
    state = reduce(state, { type: "START_BUILD_BREAK" });
    expect(state).toMatchObject({ screen: "buildBreak", missionId: "warmup-first-letter" });
    state = reduce(state, { type: "BUILD_BREAK_END" });
    expect(state).toEqual({ screen: "adventureMap", difficulty: "starter" });
  });
});

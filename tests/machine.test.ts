import { describe, expect, it } from "vitest";
import { AppState, initialState, reduce } from "../src/state/machine";

const playingState: AppState = {
  screen: "mission",
  difficulty: "starter",
  attempt: 1,
  phase: { name: "playing" },
};

describe("app state machine", () => {
  it("walks the happy path to playing", () => {
    let s = initialState;
    s = reduce(s, { type: "PLAY" });
    expect(s.screen).toBe("keyboardCheck");
    s = reduce(s, { type: "KEYBOARD_OK" });
    expect(s.screen).toBe("difficulty");
    s = reduce(s, { type: "PICK_DIFFICULTY", difficulty: "starter" });
    expect(s.screen).toBe("briefing");
    s = reduce(s, { type: "START_MISSION" });
    expect(s).toMatchObject({ screen: "mission", phase: { name: "countdown", resuming: false } });
    s = reduce(s, { type: "COUNTDOWN_DONE" });
    expect(s).toMatchObject({ screen: "mission", phase: { name: "playing" } });
  });

  it("guards: PAUSE only applies while playing", () => {
    expect(reduce(initialState, { type: "PAUSE", reason: "user" })).toBe(initialState);
    const paused = reduce(playingState, { type: "PAUSE", reason: "user" });
    expect(paused).toMatchObject({ phase: { name: "paused", reason: "user" } });
    // Pausing an already-paused game changes nothing.
    expect(reduce(paused, { type: "PAUSE", reason: "auto" })).toBe(paused);
  });

  it("resume always goes through a countdown, never straight to playing", () => {
    const paused = reduce(playingState, { type: "PAUSE", reason: "auto" });
    const resuming = reduce(paused, { type: "RESUME" });
    expect(resuming).toMatchObject({ phase: { name: "countdown", resuming: true } });
    const back = reduce(resuming, { type: "COUNTDOWN_DONE" });
    expect(back).toMatchObject({ phase: { name: "playing" } });
  });

  it("guards: COUNTDOWN_DONE ignored outside countdown", () => {
    expect(reduce(playingState, { type: "COUNTDOWN_DONE" })).toBe(playingState);
  });

  it("restart increments the attempt (forces a fresh engine)", () => {
    const paused = reduce(playingState, { type: "PAUSE", reason: "user" });
    const restarted = reduce(paused, { type: "RESTART" });
    expect(restarted).toMatchObject({ attempt: 2, phase: { name: "countdown", resuming: false } });
  });

  it("mission end moves to results with stats; typing events have no meaning there", () => {
    const stats = {
      hearts: 3, timeLeftMs: 0, activeMs: 60000, correct: 30, accepted: 32,
      streak: 4, bestStreak: 8, completed: 30, buildBits: 150, ended: "success" as const,
    };
    const results = reduce(playingState, { type: "MISSION_END", outcome: "success", stats });
    expect(results).toMatchObject({ screen: "results", outcome: "success" });
    expect(reduce(results, { type: "PAUSE", reason: "user" })).toBe(results);
    const again = reduce(results, { type: "PLAY_AGAIN" });
    expect(again).toMatchObject({ screen: "mission", phase: { name: "countdown" } });
  });

  it("leave returns to welcome", () => {
    expect(reduce(playingState, { type: "LEAVE" })).toEqual({ screen: "welcome" });
  });
});

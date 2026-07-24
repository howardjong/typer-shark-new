import { describe, expect, it } from "vitest";
import { AppState, initialState, reduce } from "../src/state/machine";

const playingState: AppState = {
  screen: "mission",
  difficulty: "starter",
  missionId: "warmup-first-letter",
  runPolicy: "timed",
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
    expect(s.screen).toBe("adventureMap");
    s = reduce(s, { type: "SELECT_MISSION", missionId: "warmup-first-letter", runPolicy: "timed" });
    expect(s.screen).toBe("briefing");
    s = reduce(s, { type: "START_MISSION" });
    expect(s).toMatchObject({ screen: "mission", phase: { name: "countdown", resuming: false } });
    s = reduce(s, { type: "COUNTDOWN_DONE" });
    expect(s).toMatchObject({ screen: "mission", phase: { name: "playing" } });
  });

  it("opens Key Camp directly from welcome without entering campaign state", () => {
    const camp = reduce(initialState, { type: "OPEN_KEY_CAMP" });
    expect(camp).toEqual({ screen: "keyCamp" });
    expect(reduce(camp, { type: "HOME" })).toEqual(initialState);
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
      streak: 4, bestStreak: 8, completed: 30, buildBits: 150,
      shieldCharge: 3, shieldReady: false, ended: "success" as const,
    };
    const results = reduce(playingState, { type: "MISSION_END", outcome: "success", stats });
    expect(results).toMatchObject({ screen: "results", outcome: "success" });
    expect(reduce(results, { type: "PAUSE", reason: "user" })).toBe(results);
    const again = reduce(results, { type: "PLAY_AGAIN" });
    expect(again).toMatchObject({ screen: "mission", phase: { name: "countdown" } });
  });

  it("leave returns to welcome", () => {
    expect(reduce(playingState, { type: "LEAVE" })).toEqual({
      screen: "adventureMap",
      difficulty: "starter",
    });
  });

  it("keeps selected mission and practice policy explicit through map selection", () => {
    const map = {
      screen: "adventureMap" as const,
      difficulty: "standard" as const,
    };
    const briefing = reduce(map, {
      type: "SELECT_MISSION",
      missionId: "kelp-shellback",
      runPolicy: "practice",
    });
    expect(briefing).toMatchObject({
      screen: "briefing",
      missionId: "kelp-shellback",
      runPolicy: "practice",
    });
    const mission = reduce(briefing, { type: "START_MISSION" });
    expect(mission).toMatchObject({
      screen: "practice",
      missionId: "kelp-shellback",
    });
  });

  it("keeps untimed practice out of the timed mission state and repeats it directly", () => {
    const practice = reduce(
      { screen: "adventureMap" as const, difficulty: "starter" as const },
      { type: "SELECT_MISSION", missionId: "warmup-first-letter", runPolicy: "practice" },
    );
    const active = reduce(practice, { type: "START_MISSION" });
    expect(active).toMatchObject({ screen: "practice", attempt: 1 });
    if (active.screen !== "practice") throw new Error("expected practice state");
    const results = reduce(active, {
      type: "PRACTICE_END",
      stats: {
        hearts: 0, timeLeftMs: 0, activeMs: 20_000, correct: 8, accepted: 9,
        streak: 1, bestStreak: 2, completed: 2, buildBits: 0,
        shieldCharge: 0, shieldReady: false, ended: "success",
      },
    });
    expect(results).toMatchObject({ screen: "results", runPolicy: "practice" });
    expect(reduce(results, { type: "PLAY_AGAIN" })).toMatchObject({ screen: "practice" });
  });

  it("shows a completed Current Gate celebration before its normal results card", () => {
    const gateState: AppState = { ...playingState, missionId: "sunlit-gate" };
    const stats = {
      hearts: 2, timeLeftMs: 0, activeMs: 25_000, correct: 12, accepted: 13,
      streak: 4, bestStreak: 6, completed: 8, buildBits: 24,
      shieldCharge: 0, shieldReady: false, ended: "success" as const,
    };
    const celebration = reduce(gateState, {
      type: "MISSION_END",
      outcome: "success",
      stats,
      celebrate: true,
    });
    expect(celebration).toMatchObject({ screen: "gateCelebration", missionId: "sunlit-gate" });
    const results = reduce(celebration, { type: "CELEBRATION_COMPLETE" });
    expect(results).toMatchObject({ screen: "results", outcome: "success", runPolicy: "timed" });
  });

  it("keeps Deep Current's selected pace, breather, and results transitions explicit", () => {
    const map = { screen: "adventureMap" as const, difficulty: "starter" as const };
    const setup = reduce(map, { type: "SELECT_DEEP_CURRENT" });
    expect(setup).toMatchObject({ screen: "deepCurrentSetup", difficulty: "starter" });
    const swiftSetup = reduce(setup, { type: "PICK_DEEP_CURRENT_DIFFICULTY", difficulty: "swift" });
    const run = reduce(swiftSetup, { type: "START_DEEP_CURRENT" });
    expect(run).toMatchObject({ screen: "deepCurrent", difficulty: "swift", phase: { name: "countdown" } });
    const playing = reduce(run, { type: "COUNTDOWN_DONE" });
    const breather = reduce(playing, { type: "DEEP_CURRENT_BREATHER" });
    expect(breather).toMatchObject({ phase: { name: "breather" } });
    const resumed = reduce(breather, { type: "DEEP_CURRENT_CONTINUE" });
    expect(resumed).toMatchObject({ phase: { name: "countdown", resuming: true } });
    const results = reduce(resumed, { type: "DEEP_CURRENT_END", distance: 74, isNewBest: true });
    expect(results).toMatchObject({ screen: "deepCurrentResults", distance: 74, isNewBest: true });
  });
});

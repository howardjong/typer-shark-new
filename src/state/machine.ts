/**
 * Dependency-free application state machine: a discriminated union plus a
 * pure event reducer with explicit guards. Only the mission "playing" phase
 * may advance simulation time or accept typing input — that is enforced by
 * the components, which key everything off this state.
 */
import type { DifficultyId } from "../game/config";
import type { MissionOutcome } from "../game/engine";
import type { EngineSnapshot } from "../game/engine";
import type { MissionId } from "../game/missions";

export type PauseReason = "user" | "auto" | "reminder";
export type MissionPhase =
  | { name: "countdown"; resuming: boolean }
  | { name: "playing" }
  | { name: "paused"; reason: PauseReason }
  | { name: "breather" };

/** Timed campaign play and untimed practice share mission data, not rewards. */
export type RunPolicy = "timed" | "practice";

export type AppState =
  | { screen: "welcome" }
  | { screen: "keyCamp" }
  | { screen: "keyboardCheck" }
  | { screen: "difficulty" }
  | { screen: "adventureMap"; difficulty: DifficultyId }
  | { screen: "deepCurrentSetup"; difficulty: DifficultyId }
  | { screen: "briefing"; difficulty: DifficultyId; missionId: MissionId; runPolicy: RunPolicy }
  | {
      screen: "mission";
      difficulty: DifficultyId;
      missionId: MissionId;
      runPolicy: RunPolicy;
      attempt: number;
      phase: MissionPhase;
    }
  | {
      screen: "practice";
      difficulty: DifficultyId;
      missionId: MissionId;
      attempt: number;
    }
  | {
      screen: "buildBreak";
      difficulty: DifficultyId;
      missionId: MissionId;
      attempt: number;
    }
  | {
      screen: "gateCelebration";
      difficulty: DifficultyId;
      missionId: MissionId;
      stats: EngineSnapshot;
    }
  | {
      screen: "deepCurrent";
      difficulty: DifficultyId;
      attempt: number;
      phase: MissionPhase;
    }
  | {
      screen: "deepCurrentResults";
      difficulty: DifficultyId;
      distance: number;
      isNewBest: boolean;
    }
  | {
      screen: "results";
      difficulty: DifficultyId;
      missionId: MissionId;
      runPolicy: RunPolicy;
      outcome: MissionOutcome;
      stats: EngineSnapshot;
    };

export type AppEvent =
  | { type: "PLAY" }
  | { type: "OPEN_KEY_CAMP" }
  | { type: "KEYBOARD_OK" }
  | { type: "PICK_DIFFICULTY"; difficulty: DifficultyId }
  | { type: "SELECT_DEEP_CURRENT" }
  | { type: "PICK_DEEP_CURRENT_DIFFICULTY"; difficulty: DifficultyId }
  | { type: "START_DEEP_CURRENT" }
  | { type: "DEEP_CURRENT_BREATHER" }
  | { type: "DEEP_CURRENT_CONTINUE" }
  | { type: "DEEP_CURRENT_END"; distance: number; isNewBest: boolean }
  | { type: "DEEP_CURRENT_PLAY_AGAIN" }
  | { type: "VIEW_MAP" }
  | { type: "SELECT_MISSION"; missionId: MissionId; runPolicy: RunPolicy }
  | { type: "START_MISSION" }
  | { type: "PRACTICE_END"; stats: EngineSnapshot }
  | { type: "PRACTICE_RESTART" }
  | { type: "PRACTICE_FROM_RESULTS" }
  | { type: "START_BUILD_BREAK" }
  | { type: "BUILD_BREAK_END" }
  | { type: "BUILD_BREAK_RESTART" }
  | { type: "CELEBRATION_COMPLETE" }
  | { type: "COUNTDOWN_DONE" }
  | { type: "PAUSE"; reason: PauseReason }
  | { type: "RESUME" }
  | { type: "RESTART" }
  | { type: "LEAVE" }
  | { type: "MISSION_END"; outcome: MissionOutcome; stats: EngineSnapshot; celebrate?: boolean }
  | { type: "PLAY_AGAIN" }
  | { type: "HOME" };

export const initialState: AppState = { screen: "welcome" };

export function reduce(state: AppState, event: AppEvent): AppState {
  switch (event.type) {
    case "PLAY":
      return state.screen === "welcome" ? { screen: "keyboardCheck" } : state;

    case "OPEN_KEY_CAMP":
      return state.screen === "welcome" ? { screen: "keyCamp" } : state;

    case "KEYBOARD_OK":
      return state.screen === "keyboardCheck" ? { screen: "difficulty" } : state;

    case "PICK_DIFFICULTY":
      return state.screen === "difficulty"
        ? { screen: "adventureMap", difficulty: event.difficulty }
        : state;

    case "SELECT_DEEP_CURRENT":
      return state.screen === "adventureMap"
        ? { screen: "deepCurrentSetup", difficulty: state.difficulty }
        : state;

    case "PICK_DEEP_CURRENT_DIFFICULTY":
      return state.screen === "deepCurrentSetup" ? { ...state, difficulty: event.difficulty } : state;

    case "START_DEEP_CURRENT":
      return state.screen === "deepCurrentSetup"
        ? {
            screen: "deepCurrent",
            difficulty: state.difficulty,
            attempt: 1,
            phase: { name: "countdown", resuming: false },
          }
        : state;

    case "VIEW_MAP":
      return state.screen === "briefing" || state.screen === "results" || state.screen === "deepCurrentSetup" || state.screen === "deepCurrentResults"
        ? { screen: "adventureMap", difficulty: state.difficulty }
        : state;

    case "SELECT_MISSION":
      return state.screen === "adventureMap"
        ? {
            screen: "briefing",
            difficulty: state.difficulty,
            missionId: event.missionId,
            runPolicy: event.runPolicy,
          }
        : state;

    case "START_MISSION":
      return state.screen === "briefing"
        ? state.runPolicy === "practice"
          ? {
              screen: "practice",
              difficulty: state.difficulty,
              missionId: state.missionId,
              attempt: 1,
            }
          : {
              screen: "mission",
              difficulty: state.difficulty,
              missionId: state.missionId,
              runPolicy: state.runPolicy,
              attempt: 1,
              phase: { name: "countdown", resuming: false },
            }
        : state;

    case "PRACTICE_END":
      return state.screen === "practice"
        ? {
            screen: "results",
            difficulty: state.difficulty,
            missionId: state.missionId,
            runPolicy: "practice",
            outcome: "success",
            stats: event.stats,
          }
        : state;

    case "PRACTICE_RESTART":
      return state.screen === "practice" ? { ...state, attempt: state.attempt + 1 } : state;

    case "PRACTICE_FROM_RESULTS":
      return state.screen === "results" && state.runPolicy === "timed"
        ? {
            screen: "practice",
            difficulty: state.difficulty,
            missionId: state.missionId,
            attempt: 1,
          }
        : state;

    case "START_BUILD_BREAK":
      return state.screen === "results" && state.runPolicy === "timed" && state.outcome === "success"
        ? {
            screen: "buildBreak",
            difficulty: state.difficulty,
            missionId: state.missionId,
            attempt: 1,
          }
        : state;

    case "BUILD_BREAK_END":
      return state.screen === "buildBreak"
        ? { screen: "adventureMap", difficulty: state.difficulty }
        : state;

    case "BUILD_BREAK_RESTART":
      return state.screen === "buildBreak" ? { ...state, attempt: state.attempt + 1 } : state;

    case "CELEBRATION_COMPLETE":
      return state.screen === "gateCelebration"
        ? {
            screen: "results",
            difficulty: state.difficulty,
            missionId: state.missionId,
            runPolicy: "timed",
            outcome: "success",
            stats: state.stats,
          }
        : state;

    case "DEEP_CURRENT_BREATHER":
      return state.screen === "deepCurrent" && state.phase.name === "playing"
        ? { ...state, phase: { name: "breather" } }
        : state;

    case "DEEP_CURRENT_CONTINUE":
      return state.screen === "deepCurrent" && state.phase.name === "breather"
        ? { ...state, phase: { name: "countdown", resuming: true } }
        : state;

    case "DEEP_CURRENT_END":
      return state.screen === "deepCurrent"
        ? {
            screen: "deepCurrentResults",
            difficulty: state.difficulty,
            distance: event.distance,
            isNewBest: event.isNewBest,
          }
        : state;

    case "DEEP_CURRENT_PLAY_AGAIN":
      return state.screen === "deepCurrentResults"
        ? {
            screen: "deepCurrent",
            difficulty: state.difficulty,
            attempt: 1,
            phase: { name: "countdown", resuming: false },
          }
        : state;

    case "COUNTDOWN_DONE":
      return (state.screen === "mission" || state.screen === "deepCurrent") && state.phase.name === "countdown"
        ? { ...state, phase: { name: "playing" } }
        : state;

    case "PAUSE":
      // Guard: pausing is only meaningful during active play.
      return (state.screen === "mission" || state.screen === "deepCurrent") && state.phase.name === "playing"
        ? { ...state, phase: { name: "paused", reason: event.reason } }
        : state;

    case "RESUME":
      // Resume always goes through an explicit three-second countdown.
      return (state.screen === "mission" || state.screen === "deepCurrent") && state.phase.name === "paused"
        ? { ...state, phase: { name: "countdown", resuming: true } }
        : state;

    case "RESTART":
      return state.screen === "mission" || state.screen === "deepCurrent"
        ? {
            ...state,
            attempt: state.attempt + 1,
            phase: { name: "countdown", resuming: false },
          }
        : state;

    case "LEAVE":
      return state.screen === "mission" || state.screen === "practice" || state.screen === "buildBreak" || state.screen === "gateCelebration" || state.screen === "deepCurrent" || state.screen === "deepCurrentSetup"
        ? { screen: "adventureMap", difficulty: state.difficulty }
        : state;

    case "MISSION_END":
      return state.screen === "mission"
        ? event.celebrate && event.outcome === "success"
          ? {
              screen: "gateCelebration",
              difficulty: state.difficulty,
              missionId: state.missionId,
              stats: event.stats,
            }
          : {
            screen: "results",
            difficulty: state.difficulty,
            missionId: state.missionId,
            runPolicy: state.runPolicy,
            outcome: event.outcome,
            stats: event.stats,
          }
        : state;

    case "PLAY_AGAIN":
      return state.screen === "results"
        ? state.runPolicy === "practice"
          ? {
              screen: "practice",
              difficulty: state.difficulty,
              missionId: state.missionId,
              attempt: 1,
            }
          : {
              screen: "mission",
              difficulty: state.difficulty,
              missionId: state.missionId,
              runPolicy: state.runPolicy,
              attempt: 1,
              phase: { name: "countdown", resuming: false },
            }
        : state;

    case "HOME":
      return state.screen === "results" || state.screen === "difficulty" ||
        state.screen === "briefing" || state.screen === "keyboardCheck" || state.screen === "adventureMap" ||
        state.screen === "practice" || state.screen === "gateCelebration" || state.screen === "deepCurrent" || state.screen === "deepCurrentSetup" || state.screen === "deepCurrentResults" || state.screen === "keyCamp"
        ? { screen: "welcome" }
        : state;

    default:
      return state;
  }
}

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
  | { name: "paused"; reason: PauseReason };

/** Timed campaign play and untimed practice share mission data, not rewards. */
export type RunPolicy = "timed" | "practice";

const WARMUP_MISSION_ID: MissionId = "warmup-first-letter";

export type AppState =
  | { screen: "welcome" }
  | { screen: "keyboardCheck" }
  | { screen: "difficulty" }
  | { screen: "adventureMap"; difficulty: DifficultyId }
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
      screen: "results";
      difficulty: DifficultyId;
      missionId: MissionId;
      runPolicy: RunPolicy;
      outcome: MissionOutcome;
      stats: EngineSnapshot;
    };

export type AppEvent =
  | { type: "PLAY" }
  | { type: "KEYBOARD_OK" }
  | { type: "PICK_DIFFICULTY"; difficulty: DifficultyId }
  | { type: "VIEW_MAP" }
  | { type: "SELECT_MISSION"; missionId: MissionId; runPolicy: RunPolicy }
  | { type: "START_MISSION" }
  | { type: "COUNTDOWN_DONE" }
  | { type: "PAUSE"; reason: PauseReason }
  | { type: "RESUME" }
  | { type: "RESTART" }
  | { type: "LEAVE" }
  | { type: "MISSION_END"; outcome: MissionOutcome; stats: EngineSnapshot }
  | { type: "PLAY_AGAIN" }
  | { type: "HOME" };

export const initialState: AppState = { screen: "welcome" };

export function reduce(state: AppState, event: AppEvent): AppState {
  switch (event.type) {
    case "PLAY":
      return state.screen === "welcome" ? { screen: "keyboardCheck" } : state;

    case "KEYBOARD_OK":
      return state.screen === "keyboardCheck" ? { screen: "difficulty" } : state;

    case "PICK_DIFFICULTY":
      return state.screen === "difficulty"
        ? {
            screen: "briefing",
            difficulty: event.difficulty,
            missionId: WARMUP_MISSION_ID,
            runPolicy: "timed",
          }
        : state;

    case "VIEW_MAP":
      return state.screen === "briefing" || state.screen === "results"
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
        ? {
            screen: "mission",
            difficulty: state.difficulty,
            missionId: state.missionId,
            runPolicy: state.runPolicy,
            attempt: 1,
            phase: { name: "countdown", resuming: false },
          }
        : state;

    case "COUNTDOWN_DONE":
      return state.screen === "mission" && state.phase.name === "countdown"
        ? { ...state, phase: { name: "playing" } }
        : state;

    case "PAUSE":
      // Guard: pausing is only meaningful during active play.
      return state.screen === "mission" && state.phase.name === "playing"
        ? { ...state, phase: { name: "paused", reason: event.reason } }
        : state;

    case "RESUME":
      // Resume always goes through an explicit three-second countdown.
      return state.screen === "mission" && state.phase.name === "paused"
        ? { ...state, phase: { name: "countdown", resuming: true } }
        : state;

    case "RESTART":
      return state.screen === "mission"
        ? {
            ...state,
            attempt: state.attempt + 1,
            phase: { name: "countdown", resuming: false },
          }
        : state;

    case "LEAVE":
      return state.screen === "mission" ? { screen: "welcome" } : state;

    case "MISSION_END":
      return state.screen === "mission"
        ? {
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
        ? {
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
        state.screen === "briefing" || state.screen === "keyboardCheck" || state.screen === "adventureMap"
        ? { screen: "welcome" }
        : state;

    default:
      return state;
  }
}

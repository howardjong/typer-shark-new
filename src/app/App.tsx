import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { DIFFICULTIES } from "../game/config";
import type { MissionOutcome, EngineSnapshot } from "../game/engine";
import { getMission } from "../game/missions";
import type { MissionId } from "../game/missions";
import { accuracyPct, wordsPerMinute } from "../game/stats";
import { audio } from "../audio/audio";
import { initialState, reduce } from "../state/machine";
import { getStorage } from "../state/storage";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from "../state/settings";
import { loadProgress, recordMissionResult, saveProgress, DEFAULT_PROGRESS } from "../state/progress";
import { recordBuildBreakReward } from "../state/progress";
import { Welcome } from "../components/Welcome";
import { KeyboardCheck } from "../components/KeyboardCheck";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { AdventureMap } from "../components/AdventureMap";
import { Briefing } from "../components/Briefing";
import { GameScreen } from "../components/GameScreen";
import { ResultsCard } from "../components/ResultsCard";
import { PracticeScreen } from "../components/PracticeScreen";
import { BuildBreakScreen } from "../components/BuildBreakScreen";
import { GateScreen } from "../components/GateScreen";
import { SettingsPanel } from "../components/SettingsPanel";

export function App() {
  const { storage, persistent } = useMemo(() => {
    try {
      return getStorage();
    } catch {
      return { storage: null, persistent: false } as never;
    }
  }, []);

  const [settings, setSettings] = useState<Settings>(() =>
    storage ? loadSettings(storage) : { ...DEFAULT_SETTINGS },
  );
  const [progress, setProgress] = useState(() =>
    storage ? loadProgress(storage) : { ...DEFAULT_PROGRESS },
  );
  const [state, dispatch] = useReducer(reduce, initialState);
  const [showSettings, setShowSettings] = useState(false);
  const [caption, setCaption] = useState("");

  // Persist settings and keep audio volumes in sync.
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if (storage) saveSettings(storage, next);
        return next;
      });
    },
    [storage],
  );

  useEffect(() => {
    audio.setVolumes(settings.masterVolume, settings.sfxVolume, settings.musicVolume);
  }, [settings.masterVolume, settings.sfxVolume, settings.musicVolume]);

  // Captions: show briefly, only when enabled.
  useEffect(() => {
    audio.onCaption = (text) => {
      setCaption((prev) => (prev === text ? prev : text));
    };
    return () => {
      audio.onCaption = () => {};
    };
  }, []);
  useEffect(() => {
    if (!caption) return;
    const t = window.setTimeout(() => setCaption(""), 1600);
    return () => window.clearTimeout(t);
  }, [caption]);

  const handleMissionEnd = useCallback(
    (missionId: MissionId, outcome: MissionOutcome, stats: EngineSnapshot) => {
      const mission = getMission(missionId);
      const next = recordMissionResult(progress, missionId, {
        success: outcome === "success",
        accuracy: accuracyPct(stats.correct, stats.accepted),
        wpm: wordsPerMinute(stats.correct, stats.activeMs),
        buildBits: stats.buildBits,
        bestStreak: stats.bestStreak,
        buildPiece: mission.buildReward,
      });
      setProgress(next);
      if (storage) saveProgress(storage, next);
      dispatch({ type: "MISSION_END", outcome, stats });
    },
    [progress, storage],
  );

  const resetProgress = useCallback(() => {
    const reset = { ...DEFAULT_PROGRESS, completedMissions: [], best: {}, buildBits: 0 };
    setProgress(reset);
    if (storage) saveProgress(storage, reset);
  }, [storage]);

  const handleBuildBreakEnd = useCallback((buildBits: number) => {
    setProgress((current) => {
      const next = recordBuildBreakReward(current, buildBits);
      if (storage) saveProgress(storage, next);
      return next;
    });
    dispatch({ type: "BUILD_BREAK_END" });
  }, [storage]);

  const rootClass = [
    "app",
    settings.textSize === "large" ? "text-large" : "",
    settings.contrast === "extra" ? "contrast-extra" : "",
    settings.reducedFeedback ? "reduced-feedback" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {!persistent && (
        <div className="storage-notice" role="status">
          Progress will last until this tab closes.
        </div>
      )}

      {state.screen === "welcome" && (
        <Welcome
          buildBits={progress.buildBits}
          onPlay={() => {
            audio.init();
            dispatch({ type: "PLAY" });
          }}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {state.screen === "keyboardCheck" && (
        <KeyboardCheck
          onDetected={() => {
            audio.init();
            dispatch({ type: "KEYBOARD_OK" });
          }}
          onBack={() => dispatch({ type: "HOME" })}
        />
      )}

      {state.screen === "difficulty" && (
        <DifficultyPicker
          onPick={(difficulty) => dispatch({ type: "PICK_DIFFICULTY", difficulty })}
          onBack={() => dispatch({ type: "HOME" })}
        />
      )}

      {state.screen === "adventureMap" && (
        <AdventureMap
          difficulty={state.difficulty}
          progress={progress}
          onSelectMission={(missionId) => dispatch({ type: "SELECT_MISSION", missionId, runPolicy: "timed" })}
          onPracticeMission={(missionId) => dispatch({ type: "SELECT_MISSION", missionId, runPolicy: "practice" })}
          onBack={() => dispatch({ type: "HOME" })}
        />
      )}

      {state.screen === "briefing" && (
        <Briefing
          mission={getMission(state.missionId)}
          difficulty={DIFFICULTIES[state.difficulty]}
          runPolicy={state.runPolicy}
          onStart={() => {
            audio.init();
            dispatch({ type: "START_MISSION" });
          }}
          onBack={() => dispatch({ type: "VIEW_MAP" })}
        />
      )}

      {state.screen === "mission" && getMission(state.missionId).kind === "regular" && (
        <GameScreen
          key={state.attempt}
          difficultyId={state.difficulty}
          mission={getMission(state.missionId)}
          phase={state.phase}
          settings={settings}
          updateSettings={updateSettings}
          dispatch={dispatch}
          onMissionEnd={handleMissionEnd}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {state.screen === "mission" && getMission(state.missionId).kind === "current-gate" && (
        <GateScreen
          key={state.attempt}
          difficultyId={state.difficulty}
          mission={getMission(state.missionId)}
          phase={state.phase}
          settings={settings}
          updateSettings={updateSettings}
          dispatch={dispatch}
          onMissionEnd={handleMissionEnd}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {state.screen === "practice" && (
        <PracticeScreen
          key={state.attempt}
          mission={getMission(state.missionId)}
          onFinish={(stats) => dispatch({ type: "PRACTICE_END", stats })}
          onRestart={() => dispatch({ type: "PRACTICE_RESTART" })}
          onLeave={() => dispatch({ type: "LEAVE" })}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {state.screen === "buildBreak" && (
        <BuildBreakScreen
          key={state.attempt}
          mission={getMission(state.missionId)}
          onFinish={handleBuildBreakEnd}
          onRestart={() => dispatch({ type: "BUILD_BREAK_RESTART" })}
          onLeave={() => dispatch({ type: "LEAVE" })}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {state.screen === "results" && (
        <ResultsCard
          outcome={state.outcome}
          runPolicy={state.runPolicy}
          stats={state.stats}
          onPlayAgain={() => dispatch({ type: "PLAY_AGAIN" })}
          onBuildBreak={
            state.runPolicy === "timed" && state.outcome === "success" && getMission(state.missionId).kind === "regular"
              ? () => dispatch({ type: "START_BUILD_BREAK" })
              : undefined
          }
          onMap={() => dispatch({ type: "VIEW_MAP" })}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          onResetProgress={resetProgress}
          onClose={() => setShowSettings(false)}
        />
      )}

      {settings.captions && caption && (
        <div className="caption-bar" role="status">
          {caption}
        </div>
      )}
    </div>
  );
}

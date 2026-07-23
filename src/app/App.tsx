import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { DIFFICULTIES } from "../game/config";
import type { MissionOutcome, EngineSnapshot } from "../game/engine";
import { accuracyPct, wordsPerMinute } from "../game/stats";
import { WARMUP_LESSON } from "../game/wordBanks";
import { audio } from "../audio/audio";
import { initialState, reduce } from "../state/machine";
import { getStorage } from "../state/storage";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from "../state/settings";
import { loadProgress, recordMissionResult, saveProgress, DEFAULT_PROGRESS } from "../state/progress";
import { Welcome } from "../components/Welcome";
import { KeyboardCheck } from "../components/KeyboardCheck";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { Briefing } from "../components/Briefing";
import { GameScreen } from "../components/GameScreen";
import { ResultsCard } from "../components/ResultsCard";
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
    (outcome: MissionOutcome, stats: EngineSnapshot) => {
      const next = recordMissionResult(progress, WARMUP_LESSON.id, {
        success: outcome === "success",
        accuracy: accuracyPct(stats.correct, stats.accepted),
        wpm: wordsPerMinute(stats.correct, stats.activeMs),
        buildBits: stats.buildBits,
      });
      setProgress(next);
      if (storage) saveProgress(storage, next);
      dispatch({ type: "MISSION_END", outcome, stats });
    },
    [progress, storage],
  );

  const resetProgress = useCallback(() => {
    setProgress({ ...DEFAULT_PROGRESS, completedMissions: [], best: {}, buildBits: 0 });
    if (storage) saveProgress(storage, { completedMissions: [], best: {}, buildBits: 0 });
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

      {state.screen === "briefing" && (
        <Briefing
          lesson={WARMUP_LESSON}
          difficulty={DIFFICULTIES[state.difficulty]}
          onStart={() => {
            audio.init();
            dispatch({ type: "START_MISSION" });
          }}
          onBack={() => dispatch({ type: "HOME" })}
        />
      )}

      {state.screen === "mission" && (
        <GameScreen
          key={state.attempt}
          difficultyId={state.difficulty}
          phase={state.phase}
          settings={settings}
          updateSettings={updateSettings}
          dispatch={dispatch}
          onMissionEnd={handleMissionEnd}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {state.screen === "results" && (
        <ResultsCard
          outcome={state.outcome}
          stats={state.stats}
          onPlayAgain={() => dispatch({ type: "PLAY_AGAIN" })}
          onHome={() => dispatch({ type: "HOME" })}
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

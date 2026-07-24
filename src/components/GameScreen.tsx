import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { DIFFICULTIES, DifficultyId } from "../game/config";
import { Engine, EngineEvent, EngineSnapshot, MissionOutcome } from "../game/engine";
import { classifyKey } from "../game/input";
import type { MissionDefinition } from "../game/missions";
import { isOrdinaryTargetFamily } from "../game/targetTypes";
import { STARTER_CVC_WORDS } from "../game/wordBanks";
import { audio } from "../audio/audio";
import type { Settings } from "../state/settings";
import type { AppEvent, MissionPhase } from "../state/machine";
import { Countdown } from "./Countdown";
import { Hud } from "./Hud";
import { PausePanel } from "./PausePanel";
import { TargetCreature } from "./TargetCreature";

interface Props {
  difficultyId: DifficultyId;
  mission: MissionDefinition;
  phase: MissionPhase;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  dispatch: (event: AppEvent) => void;
  onMissionEnd: (missionId: MissionDefinition["id"], outcome: MissionOutcome, stats: EngineSnapshot) => void;
  onOpenSettings: () => void;
}

const TARGET_WIDTH_PX = 320;
const HINT_DURATION_MS = 2500;

export function GameScreen({
  difficultyId,
  mission,
  phase,
  settings,
  updateSettings,
  dispatch,
  onMissionEnd,
  onOpenSettings,
}: Props) {
  const difficulty = DIFFICULTIES[difficultyId];

  // The engine lives for the whole mission attempt (App keys this component
  // by attempt number, so Restart recreates everything cleanly).
  const engine = useMemo(
    () =>
      new Engine({
        difficulty: {
          ...difficulty,
          noSameFirstLetter: difficulty.noSameFirstLetter || settings.noSameFirstLetter,
        },
        motion: settings.motion,
        run: {
          id: mission.id,
          labels: mission.labels,
          targetFamilies: mission.targetFamilies.filter(isOrdinaryTargetFamily),
          shellbackLabels: mission.labels,
          bonusLabels: STARTER_CVC_WORDS,
        },
        seed: (Date.now() ^ 0x5eed) >>> 0,
      }),
    // Intentionally created once per mount; settings applied at resume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [, forceRender] = useReducer((c: number) => c + 1, 0);
  const [hint, setHint] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldWidthRef = useRef(0);
  const nodeRefs = useRef(new Map<number, HTMLDivElement>());
  const lastTimeRef = useRef<number | null>(null);
  const remindedRef = useRef(false);
  const endedRef = useRef(false);
  const hintTimerRef = useRef(0);

  const playing = phase.name === "playing";

  const xToPx = useCallback((x: number) => {
    const width = fieldWidthRef.current;
    return Math.max(0, x * Math.max(0, width - TARGET_WIDTH_PX));
  }, []);

  const measureField = useCallback(() => {
    if (fieldRef.current) fieldWidthRef.current = fieldRef.current.clientWidth;
  }, []);

  // Handle engine events: audio, live region, hints, mission end.
  const handleEvents = useCallback(
    (events: EngineEvent[]) => {
      for (const ev of events) {
        switch (ev.type) {
          case "select":
            audio.play("select");
            break;
          case "progress":
            audio.play("correct");
            break;
          case "complete":
            audio.play(ev.badge ? "badge" : "complete");
            setLiveMessage(
              ev.badge
                ? `Streak badge! ${ev.streak} in a row!`
                : `Cleared ${ev.label}. Great!`,
            );
            break;
          case "nextLabel":
            setLiveMessage(`Next word: ${ev.label}.`);
            break;
          case "wrongKey":
            audio.play("wrong");
            break;
          case "noMatch":
            audio.play("wrong");
            if (difficulty.id === "starter") {
              const firsts = [...new Set(engine.targets.map((t) => t.label[0]))];
              if (firsts.length > 0) {
                setHint(`Try a label that starts with ${firsts.join(" or ").toUpperCase()}`);
                window.clearTimeout(hintTimerRef.current);
                hintTimerRef.current = window.setTimeout(
                  () => setHint(null),
                  HINT_DURATION_MS,
                );
              }
            }
            break;
          case "miss":
            audio.play("miss");
            setLiveMessage(`A fish reached the bay. ${ev.heartsLeft} hearts left.`);
            break;
          case "drift":
            setLiveMessage("The Treasure Bubble drifted safely away.");
            break;
          case "shieldReady":
            audio.play("badge");
            setLiveMessage("Reef Shield ready. Press Enter when you want a clear current.");
            break;
          case "shieldUsed":
            audio.play("complete");
            setLiveMessage(`Reef Shield cleared ${ev.cleared} target${ev.cleared === 1 ? "" : "s"}.`);
            break;
          case "end":
            if (!endedRef.current) {
              endedRef.current = true;
              audio.play(ev.outcome === "success" ? "victory" : "defeat");
              onMissionEnd(mission.id, ev.outcome, engine.snapshot());
            }
            break;
          case "stall":
            // Handled by the loop via auto-pause.
            break;
          default:
            break;
        }
      }
    },
    [difficulty.id, engine, mission.id, onMissionEnd],
  );

  // Main loop: runs only while playing. Installs exactly once per playing
  // period and cleans up fully (Strict-Mode safe).
  useEffect(() => {
    if (!playing) return;
    let rafId = 0;
    let cancelled = false;
    // Motion changes made during pause apply here, after the countdown.
    engine.setMotion(settings.motion);
    measureField();
    lastTimeRef.current = null;

    const loop = (now: number) => {
      if (cancelled) return;
      const last = lastTimeRef.current;
      lastTimeRef.current = now;
      if (last !== null) {
        const result = engine.tick(now - last);
        if (result === "stall") {
          dispatch({ type: "PAUSE", reason: "auto" });
          return;
        }
        // Pause reminder uses active-play time only.
        if (
          settings.pauseReminderMin > 0 &&
          !remindedRef.current &&
          engine.activeMs > settings.pauseReminderMin * 60000
        ) {
          remindedRef.current = true;
          dispatch({ type: "PAUSE", reason: "reminder" });
          return;
        }
        const events = engine.drainEvents();
        if (events.length > 0) {
          handleEvents(events);
          forceRender();
        }
        // Apply positions imperatively — React does not render per frame.
        for (const t of engine.targets) {
          const el = nodeRefs.current.get(t.id);
          if (el) el.style.transform = `translate3d(${xToPx(t.x)}px, 0, 0)`;
        }
        forceHudTick(now);
      }
      rafId = requestAnimationFrame(loop);
    };

    // HUD timer re-renders at most ~4 times per second.
    let lastHud = 0;
    const forceHudTick = (now: number) => {
      if (now - lastHud > 250) {
        lastHud = now;
        forceRender();
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [playing, engine, settings.motion, settings.pauseReminderMin, dispatch, handleEvents, measureField, xToPx]);

  // Auto-pause on blur, hidden tab, or resize (recompute bounds on resume).
  useEffect(() => {
    if (!playing) return;
    const pause = () => dispatch({ type: "PAUSE", reason: "auto" });
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", pause);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", pause);
    };
  }, [playing, dispatch]);

  // Focus the gameplay surface whenever play starts/resumes.
  useEffect(() => {
    if (playing || phase.name === "countdown") containerRef.current?.focus();
  }, [playing, phase.name]);

  const useReefShield = useCallback(() => {
    if (!playing || !engine.activateReefShield()) return;
    handleEvents(engine.drainEvents());
    forceRender();
  }, [engine, handleEvents, playing]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const action = classifyKey(e.nativeEvent);
      if (phase.name === "playing") {
        if (action.kind === "escape") {
          e.preventDefault();
          dispatch({ type: "PAUSE", reason: "user" });
        } else if (action.kind === "char") {
          e.preventDefault();
          engine.handleKey(action.char);
          forceRender();
        } else if (action.kind === "enter") {
          if (engine.activateReefShield()) {
            e.preventDefault();
            handleEvents(engine.drainEvents());
            forceRender();
          }
        } else if (action.kind === "space") {
          // Prevent page scroll during play; not a typing attempt.
          e.preventDefault();
        }
      } else if (phase.name === "paused") {
        if (action.kind === "enter" || action.kind === "space") {
          e.preventDefault();
          dispatch({ type: "RESUME" });
        }
      }
      // Countdown: all input intentionally ignored (not counted anywhere).
    },
    [phase.name, dispatch, engine, handleEvents],
  );

  useEffect(() => () => window.clearTimeout(hintTimerRef.current), []);

  const snapshot = engine.snapshot();

  return (
    <div
      ref={containerRef}
      className="screen game-screen"
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label="Block Reef play area"
    >
      {/* Decorative layered background */}
      <div className="water-bg" aria-hidden="true">
        <div className="sand-strip" />
        <div className="kelp k1" />
        <div className="kelp k2" />
        <div className="kelp k3" />
        <div className="base-bay">
          <div className="bay-block bb1" />
          <div className="bay-block bb2" />
          <div className="bay-block bb3" />
          <span className="bay-label">Pebble Bay</span>
        </div>
      </div>

      <Hud
        hearts={snapshot.hearts}
        maxHearts={difficulty.hearts}
        timeLeftMs={snapshot.timeLeftMs}
        buildBits={snapshot.buildBits}
        streak={snapshot.streak}
        shieldCharge={snapshot.shieldCharge}
        shieldReady={snapshot.shieldReady}
        onUseShield={useReefShield}
        onPause={() => dispatch({ type: "PAUSE", reason: "user" })}
      />

      <div className="playfield" ref={fieldRef}>
        {engine.targets.map((t) => {
          const selected = t.id === engine.selectedId;
          return (
            <div
              key={t.id}
              ref={(el) => {
                if (el) {
                  nodeRefs.current.set(t.id, el);
                  el.style.transform = `translate3d(${xToPx(t.x)}px, 0, 0)`;
                } else {
                  nodeRefs.current.delete(t.id);
                }
              }}
              className={`target lane-${t.lane}${selected ? " selected" : ""}`}
            >
              <div className={`label-plate${selected ? " focus-frame" : ""}`}>
                {t.label.split("").map((ch, i) => (
                  <span
                    key={i}
                    className={
                      i < t.typed ? "typed" : i === t.typed && selected ? "next" : ""
                    }
                  >
                    {ch}
                  </span>
                ))}
              </div>
              <TargetCreature family={t.family} variant={t.variant} />
            </div>
          );
        })}
      </div>

      {hint && (
        <div className="hint-bubble" role="status">
          {hint}
        </div>
      )}

      <div className="visually-hidden" aria-live="polite">
        {liveMessage}
      </div>

      {phase.name === "countdown" && (
        <Countdown
          resuming={phase.resuming}
          onDone={() => dispatch({ type: "COUNTDOWN_DONE" })}
        />
      )}

      {phase.name === "paused" && (
        <PausePanel
          reason={phase.reason}
          motionIsSlow={settings.motion === "slow"}
          onResume={() => dispatch({ type: "RESUME" })}
          onSlowDown={() => updateSettings({ motion: "slow" })}
          onRestart={() => dispatch({ type: "RESTART" })}
          onSettings={onOpenSettings}
          onLeave={() => dispatch({ type: "LEAVE" })}
        />
      )}
    </div>
  );
}

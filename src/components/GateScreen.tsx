import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { DIFFICULTIES, DifficultyId } from "../game/config";
import { GateEngine, GateEngineEvent, GateSnapshot } from "../game/gateEngine";
import { targetTranslateX } from "../game/positioning";
import type { MissionOutcome } from "../game/engine";
import { classifyKey } from "../game/input";
import type { MissionDefinition } from "../game/missions";
import { audio } from "../audio/audio";
import type { Settings } from "../state/settings";
import type { AppEvent, MissionPhase } from "../state/machine";
import { Countdown } from "./Countdown";
import { PausePanel } from "./PausePanel";

interface Props {
  difficultyId: DifficultyId;
  mission: MissionDefinition;
  phase: MissionPhase;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  dispatch: (event: AppEvent) => void;
  onMissionEnd: (missionId: MissionDefinition["id"], outcome: MissionOutcome, stats: GateSnapshot) => void;
  onOpenSettings: () => void;
}

const PROJECTILE_FALLBACK_WIDTH_PX = 120;

export function GateScreen({
  difficultyId,
  mission,
  phase,
  settings,
  updateSettings,
  dispatch,
  onMissionEnd,
  onOpenSettings,
}: Props) {
  if (!mission.gate) throw new Error(`Current Gate mission ${mission.id} needs gate configuration`);
  const difficulty = DIFFICULTIES[difficultyId];
  const engine = useMemo(
    () => new GateEngine({
      difficulty: { ...difficulty, noSameFirstLetter: difficulty.noSameFirstLetter || settings.noSameFirstLetter },
      motion: settings.motion,
      labels: mission.labels,
      stabilityBlocks: mission.gate!.stabilityBlocks,
      maximumVisibleProjectiles: mission.gate!.maximumVisibleProjectiles,
      seed: (Date.now() ^ 0x6a7e) >>> 0,
    }),
    // A new component is mounted for every attempt; settings apply at resume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const [liveMessage, setLiveMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldWidthRef = useRef(0);
  const projectileWidthsRef = useRef(new Map<number, number>());
  const nodeRefs = useRef(new Map<number, HTMLDivElement>());
  const lastTimeRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const playing = phase.name === "playing";

  const xToPx = useCallback((x: number, projectileId: number) => {
    return targetTranslateX(
      x,
      fieldWidthRef.current,
      projectileWidthsRef.current.get(projectileId) ?? PROJECTILE_FALLBACK_WIDTH_PX,
    );
  }, []);
  const measureField = useCallback(() => {
    if (fieldRef.current) fieldWidthRef.current = fieldRef.current.clientWidth;
  }, []);

  const handleEvents = useCallback((events: GateEngineEvent[]) => {
    for (const event of events) {
      switch (event.type) {
        case "select":
          audio.play("select");
          break;
        case "progress":
          audio.play("correct");
          break;
        case "complete":
          audio.play(event.badge ? "badge" : "complete");
          setLiveMessage(
            event.stabilityLeft === 0
              ? "Current Gate settled!"
              : `${event.stabilityLeft} stability blocks left.`,
          );
          break;
        case "wrongKey":
        case "noMatch":
          audio.play("wrong");
          break;
        case "miss":
          audio.play("miss");
          setLiveMessage(`A foam cube slipped past. ${event.heartsLeft} hearts left.`);
          break;
        case "end":
          if (!endedRef.current) {
            endedRef.current = true;
            audio.play(event.outcome === "success" ? "victory" : "defeat");
            onMissionEnd(mission.id, event.outcome, engine.snapshot());
          }
          break;
        default:
          break;
      }
    }
  }, [engine, mission.id, onMissionEnd]);

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    let rafId = 0;
    let lastHud = 0;
    engine.setMotion(settings.motion);
    measureField();
    lastTimeRef.current = null;
    const loop = (now: number) => {
      if (cancelled) return;
      const previous = lastTimeRef.current;
      lastTimeRef.current = now;
      if (previous !== null) {
        if (engine.tick(now - previous) === "stall") {
          dispatch({ type: "PAUSE", reason: "auto" });
          return;
        }
        const events = engine.drainEvents();
        if (events.length > 0) {
          handleEvents(events);
          forceRender();
        }
        for (const projectile of engine.projectiles) {
          const node = nodeRefs.current.get(projectile.id);
          if (node) node.style.transform = `translate3d(${xToPx(projectile.x, projectile.id)}px, 0, 0)`;
        }
        if (now - lastHud > 250) {
          lastHud = now;
          forceRender();
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [dispatch, engine, handleEvents, measureField, playing, settings.motion, xToPx]);

  useEffect(() => {
    if (!playing) return;
    const pause = () => dispatch({ type: "PAUSE", reason: "auto" });
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pause();
    };
    window.addEventListener("blur", pause);
    window.addEventListener("resize", pause);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", pause);
      window.removeEventListener("resize", pause);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dispatch, playing]);

  useEffect(() => {
    if (playing || phase.name === "countdown") containerRef.current?.focus();
  }, [phase.name, playing]);

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    const action = classifyKey(event.nativeEvent);
    if (phase.name === "playing") {
      if (action.kind === "escape") {
        event.preventDefault();
        dispatch({ type: "PAUSE", reason: "user" });
      } else if (action.kind === "char") {
        event.preventDefault();
        engine.handleKey(action.char);
        forceRender();
      } else if (action.kind === "space") {
        event.preventDefault();
      }
    } else if (phase.name === "paused" && (action.kind === "enter" || action.kind === "space")) {
      event.preventDefault();
      dispatch({ type: "RESUME" });
    }
  }, [dispatch, engine, phase.name]);

  const snapshot = engine.snapshot();
  const blocksSettled = snapshot.stabilityTotal - snapshot.stabilityLeft;
  return (
    <div ref={containerRef} className="screen game-screen gate-screen" tabIndex={0} onKeyDown={onKeyDown} aria-label="Current Gate encounter">
      <div className="gate-backdrop" aria-hidden="true"><div className="current-gate-art">▦</div></div>
      <div className="gate-hud">
        <span aria-label={`Shield hearts: ${snapshot.hearts} of ${difficulty.hearts}`}>♥ {snapshot.hearts}/{difficulty.hearts}</span>
        <label className="gate-stability">
          <span>Gate stability: {snapshot.stabilityLeft} blocks left</span>
          <progress value={blocksSettled} max={snapshot.stabilityTotal} />
        </label>
        <span aria-label={`Build Bits: ${snapshot.buildBits}`}>◆ {snapshot.buildBits}</span>
        <button className="btn btn-small" onClick={() => dispatch({ type: "PAUSE", reason: "user" })}>Pause</button>
      </div>
      <div className="playfield gate-playfield" ref={fieldRef}>
        {engine.projectiles.map((projectile) => {
          const selected = projectile.id === engine.selectedId;
          return (
            <div
              key={projectile.id}
              ref={(node) => {
                if (node) {
                  nodeRefs.current.set(projectile.id, node);
                  projectileWidthsRef.current.set(
                    projectile.id,
                    node.getBoundingClientRect().width || PROJECTILE_FALLBACK_WIDTH_PX,
                  );
                  node.style.transform = `translate3d(${xToPx(projectile.x, projectile.id)}px, 0, 0)`;
                } else {
                  nodeRefs.current.delete(projectile.id);
                  projectileWidthsRef.current.delete(projectile.id);
                }
              }}
              className={`target gate-projectile lane-${projectile.lane}${selected ? " selected" : ""}`}
            >
              <div className={`label-plate${selected ? " focus-frame" : ""}`}>
                {projectile.label.split("").map((character, index) => (
                  <span key={`${character}-${index}`} className={index < projectile.typed ? "typed" : index === projectile.typed && selected ? "next" : ""}>
                    {character}
                  </span>
                ))}
              </div>
              <div className={`foam-cube variant-${projectile.variant}`} aria-hidden="true" />
            </div>
          );
        })}
      </div>
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{liveMessage}</div>
      {phase.name === "countdown" && <Countdown resuming={phase.resuming} onDone={() => dispatch({ type: "COUNTDOWN_DONE" })} />}
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

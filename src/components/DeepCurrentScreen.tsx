import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { audio } from "../audio/audio";
import { DIFFICULTIES, DifficultyId } from "../game/config";
import { DeepCurrentEngine, DeepCurrentEvent, DeepCurrentSnapshot } from "../game/deepCurrentEngine";
import { targetTranslateX } from "../game/positioning";
import { classifyKey } from "../game/input";
import type { Settings } from "../state/settings";
import type { AppEvent, MissionPhase } from "../state/machine";
import { Countdown } from "./Countdown";
import { PausePanel } from "./PausePanel";
import { TargetCreature } from "./TargetCreature";

interface Props {
  difficultyId: DifficultyId;
  phase: MissionPhase;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  dispatch: (event: AppEvent) => void;
  onFinish: (snapshot: DeepCurrentSnapshot) => void;
  onOpenSettings: () => void;
}

const TARGET_FALLBACK_WIDTH_PX = 120;
const BREATHER_HOLD_MS = 5_000;

/** Endless typing with transparent pace tiers and a protected breather every minute. */
export function DeepCurrentScreen({
  difficultyId,
  phase,
  settings,
  updateSettings,
  dispatch,
  onFinish,
  onOpenSettings,
}: Props) {
  const difficulty = DIFFICULTIES[difficultyId];
  const engine = useMemo(
    () => new DeepCurrentEngine({
      difficulty: { ...difficulty, noSameFirstLetter: difficulty.noSameFirstLetter || settings.noSameFirstLetter },
      motion: settings.motion,
      seed: (Date.now() ^ 0xd33f) >>> 0,
    }),
    // The component is keyed by attempt; motion is applied after a resume.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const [liveMessage, setLiveMessage] = useState("");
  const [breatherReady, setBreatherReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const fieldWidthRef = useRef(0);
  const targetWidthsRef = useRef(new Map<number, number>());
  const nodeRefs = useRef(new Map<number, HTMLDivElement>());
  const lastTimeRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const remindedRef = useRef(false);
  const playing = phase.name === "playing";

  const xToPx = useCallback((x: number, targetId: number) => targetTranslateX(
    x,
    fieldWidthRef.current,
    targetWidthsRef.current.get(targetId) ?? TARGET_FALLBACK_WIDTH_PX,
  ), []);
  const measureField = useCallback(() => {
    if (fieldRef.current) fieldWidthRef.current = fieldRef.current.clientWidth;
  }, []);

  const finish = useCallback((snapshot: DeepCurrentSnapshot) => {
    if (endedRef.current) return;
    endedRef.current = true;
    onFinish(snapshot);
  }, [onFinish]);

  const handleEvents = useCallback((events: DeepCurrentEvent[]) => {
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
          setLiveMessage(event.badge ? `${event.streak} labels in a row!` : `Cleared ${event.label}.`);
          break;
        case "nextLabel":
          setLiveMessage(`Next word: ${event.label}.`);
          break;
        case "wrongKey":
        case "noMatch":
          audio.play("wrong");
          break;
        case "miss":
          audio.play("miss");
          setLiveMessage(`A target reached the bay. ${event.heartsLeft} hearts left.`);
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
          setLiveMessage(`Reef Shield cleared ${event.cleared} target${event.cleared === 1 ? "" : "s"}.`);
          break;
        case "breather":
          setLiveMessage(`Five-second breather at ${event.distance} metres.`);
          break;
        case "end":
          audio.play("defeat");
          finish(engine.snapshot());
          break;
        default:
          break;
      }
    }
  }, [engine, finish]);

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
        const result = engine.tick(now - previous);
        const events = engine.drainEvents();
        if (events.length > 0) {
          handleEvents(events);
          forceRender();
        }
        if (result === "stall") {
          dispatch({ type: "PAUSE", reason: "auto" });
          return;
        }
        if (result === "breather") {
          dispatch({ type: "DEEP_CURRENT_BREATHER" });
          return;
        }
        if (
          settings.pauseReminderMin > 0 &&
          !remindedRef.current &&
          engine.activeMs > settings.pauseReminderMin * 60000
        ) {
          remindedRef.current = true;
          dispatch({ type: "PAUSE", reason: "reminder" });
          return;
        }
        for (const target of engine.targets) {
          const node = nodeRefs.current.get(target.id);
          if (node) node.style.transform = `translate3d(${xToPx(target.x, target.id)}px, 0, 0)`;
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
  }, [dispatch, engine, handleEvents, measureField, playing, settings.motion, settings.pauseReminderMin, xToPx]);

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

  useEffect(() => {
    if (phase.name !== "breather") {
      setBreatherReady(false);
      return;
    }
    const timer = window.setTimeout(() => setBreatherReady(true), BREATHER_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [phase.name]);

  const useReefShield = useCallback(() => {
    if (!playing || !engine.activateReefShield()) return;
    handleEvents(engine.drainEvents());
    forceRender();
  }, [engine, handleEvents, playing]);

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
      } else if (action.kind === "enter") {
        if (engine.activateReefShield()) {
          event.preventDefault();
          handleEvents(engine.drainEvents());
          forceRender();
        }
      } else if (action.kind === "space") {
        event.preventDefault();
      }
    } else if (phase.name === "paused" && (action.kind === "enter" || action.kind === "space")) {
      event.preventDefault();
      dispatch({ type: "RESUME" });
    } else if (phase.name === "breather" && breatherReady && (action.kind === "enter" || action.kind === "space")) {
      event.preventDefault();
      dispatch({ type: "DEEP_CURRENT_CONTINUE" });
    }
  }, [breatherReady, dispatch, engine, handleEvents, phase.name]);

  const snapshot = engine.snapshot();
  return (
    <div ref={containerRef} className="screen game-screen deep-current-screen" tabIndex={0} onKeyDown={onKeyDown} aria-label="Deep Current endless play area">
      <div className="water-bg" aria-hidden="true">
        <div className="sand-strip" />
        <div className="kelp k1" />
        <div className="kelp k2" />
        <div className="kelp k3" />
      </div>
      <div className="hud deep-current-hud">
        <div className="hud-left"><span aria-label={`Shield hearts: ${snapshot.hearts} of ${difficulty.hearts}`}>♥ {snapshot.hearts}/{difficulty.hearts}</span></div>
        <div className="hud-center"><strong aria-label={`Distance: ${snapshot.distance} metres`}>Distance {snapshot.distance}m</strong></div>
        <div className="hud-right">
          <span className="deep-tier" aria-label={`Current tier: ${snapshot.tier + 1}`}>Current {snapshot.tier + 1}</span>
          <button className={`btn btn-small hud-shield${snapshot.shieldReady ? " ready" : ""}`} onClick={useReefShield} disabled={!snapshot.shieldReady}>
            Reef Shield {snapshot.shieldCharge}/10
          </button>
          <button className="btn btn-small" onClick={() => dispatch({ type: "PAUSE", reason: "user" })}>Pause</button>
        </div>
      </div>
      <div className="playfield" ref={fieldRef}>
        {engine.targets.map((target) => {
          const selected = target.id === engine.selectedId;
          return (
            <div
              key={target.id}
              ref={(node) => {
                if (node) {
                  nodeRefs.current.set(target.id, node);
                  targetWidthsRef.current.set(target.id, node.getBoundingClientRect().width || TARGET_FALLBACK_WIDTH_PX);
                  node.style.transform = `translate3d(${xToPx(target.x, target.id)}px, 0, 0)`;
                } else {
                  nodeRefs.current.delete(target.id);
                  targetWidthsRef.current.delete(target.id);
                }
              }}
              className={`target lane-${target.lane}${selected ? " selected" : ""}`}
            >
              <div className={`label-plate${selected ? " focus-frame" : ""}`}>
                {target.label.split("").map((character, index) => (
                  <span key={`${character}-${index}`} className={index < target.typed ? "typed" : index === target.typed && selected ? "next" : ""}>{character}</span>
                ))}
              </div>
              <TargetCreature family={target.family} variant={target.variant} />
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
      {phase.name === "breather" && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Deep Current breather">
          <div className="menu-card">
            <h1>Gentle breather</h1>
            <p>{breatherReady ? `You have travelled ${snapshot.distance} metres. Choose your next step.` : `You have travelled ${snapshot.distance} metres. The current is resting for five seconds.`}</p>
            <div className="button-col">
              <button className="btn btn-primary btn-big" disabled={!breatherReady} onClick={() => dispatch({ type: "DEEP_CURRENT_CONTINUE" })} autoFocus>Continue</button>
              <button className="btn" onClick={() => finish(snapshot)}>Finish Run</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

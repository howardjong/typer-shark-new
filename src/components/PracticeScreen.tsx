import { useCallback, useEffect, useRef, useState } from "react";
import type { EngineSnapshot } from "../game/engine";
import { classifyKey } from "../game/input";
import type { MissionDefinition } from "../game/missions";
import { isOrdinaryTargetFamily } from "../game/targetTypes";
import { PausePanel } from "./PausePanel";
import { TargetCreature } from "./TargetCreature";

interface PracticeTarget {
  label: string;
  typed: number;
  index: number;
}

interface PracticeStats {
  activeMs: number;
  correct: number;
  accepted: number;
  streak: number;
  bestStreak: number;
  completed: number;
}

interface Props {
  mission: MissionDefinition;
  onFinish: (stats: EngineSnapshot) => void;
  onRestart: () => void;
  onLeave: () => void;
  onOpenSettings: () => void;
}

function initialTarget(mission: MissionDefinition): PracticeTarget {
  return { label: mission.labels[0] ?? "a", typed: 0, index: 0 };
}

function emptyStats(): PracticeStats {
  return { activeMs: 0, correct: 0, accepted: 0, streak: 0, bestStreak: 0, completed: 0 };
}

/**
 * Untimed practice is intentionally separate from the moving engine: one
 * stationary real lesson label, no hearts, rewards, unlocks, or permanent
 * statistics. It still reports private immediate accuracy/WPM feedback.
 */
export function PracticeScreen({ mission, onFinish, onRestart, onLeave, onOpenSettings }: Props) {
  const [paused, setPaused] = useState(false);
  const [target, setTarget] = useState(() => initialTarget(mission));
  const [stats, setStats] = useState<PracticeStats>(emptyStats);
  const [hint, setHint] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(target);
  const statsRef = useRef(stats);
  const activeMsRef = useRef(0);
  const family = mission.targetFamilies.find(isOrdinaryTargetFamily) ?? "pebble-puffer";

  const setPracticeTarget = useCallback((next: PracticeTarget) => {
    targetRef.current = next;
    setTarget(next);
  }, []);

  const setPracticeStats = useCallback((next: PracticeStats) => {
    statsRef.current = next;
    setStats(next);
  }, []);

  const snapshot = useCallback((): EngineSnapshot => {
    const current = statsRef.current;
    return {
      hearts: 0,
      timeLeftMs: 0,
      activeMs: activeMsRef.current,
      correct: current.correct,
      accepted: current.accepted,
      streak: current.streak,
      bestStreak: current.bestStreak,
      completed: current.completed,
      buildBits: 0,
      shieldCharge: 0,
      shieldReady: false,
      ended: "success",
    };
  }, []);

  // Active time uses elapsed frames only while unpaused; there is no timer or
  // movement, but WPM must still exclude pause/hidden-tab time.
  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    let rafId = 0;
    let previous: number | null = null;
    const tick = (now: number) => {
      if (cancelled) return;
      if (previous !== null) activeMsRef.current += Math.min(Math.max(now - previous, 0), 100);
      previous = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [paused]);

  useEffect(() => {
    if (!paused) containerRef.current?.focus();
  }, [paused]);

  useEffect(() => {
    if (paused) return;
    const pause = () => setPaused(true);
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
  }, [paused]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const action = classifyKey(event.nativeEvent);
    if (action.kind === "escape") {
      event.preventDefault();
      setPaused(true);
      return;
    }
    if (paused) {
      if (action.kind === "enter" || action.kind === "space") {
        event.preventDefault();
        setPaused(false);
      }
      return;
    }
    if (action.kind !== "char") {
      if (action.kind === "space") event.preventDefault();
      return;
    }

    event.preventDefault();
    const currentTarget = targetRef.current;
    const currentStats = statsRef.current;
    const expected = currentTarget.label[currentTarget.typed];
    if (action.char !== expected) {
      setPracticeStats({ ...currentStats, accepted: currentStats.accepted + 1, streak: 0 });
      setHint(`Try the next letter: ${expected.toUpperCase()}`);
      return;
    }

    const accepted = currentStats.accepted + 1;
    const correct = currentStats.correct + 1;
    const nextTyped = currentTarget.typed + 1;
    if (nextTyped < currentTarget.label.length) {
      setPracticeTarget({ ...currentTarget, typed: nextTyped });
      setPracticeStats({ ...currentStats, accepted, correct });
      setHint("");
      return;
    }

    const nextIndex = (currentTarget.index + 1) % mission.labels.length;
    const nextLabel = mission.labels[nextIndex] ?? currentTarget.label;
    const streak = currentStats.streak + 1;
    setPracticeTarget({ label: nextLabel, typed: 0, index: nextIndex });
    setPracticeStats({
      ...currentStats,
      accepted,
      correct,
      streak,
      bestStreak: Math.max(currentStats.bestStreak, streak),
      completed: currentStats.completed + 1,
    });
    setHint(`Nice! Next label: ${nextLabel}`);
  }, [mission.labels, paused, setPracticeStats, setPracticeTarget]);

  return (
    <div
      ref={containerRef}
      className="screen practice-screen"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Untimed Block Reef practice"
    >
      <div className="practice-header">
        <div>
          <span className="practice-kicker">Practise without timer</span>
          <strong>{mission.title}</strong>
        </div>
        <button className="btn btn-small" onClick={() => onFinish(snapshot())}>Finish Practise</button>
      </div>
      <main className="practice-main">
        <p className="lesson-label">{mission.lessonLabel}</p>
        <p>One label at a time. Take as long as you need.</p>
        <div className="practice-target" aria-live="polite">
          <div className="label-plate practice-label">
            {target.label.split("").map((character, index) => (
              <span
                key={`${character}-${index}`}
                className={index < target.typed ? "typed" : index === target.typed ? "next" : ""}
              >
                {character}
              </span>
            ))}
          </div>
          <TargetCreature family={family} variant={target.index} />
        </div>
        <p className="practice-hint" role="status">{hint || "Type the label when you are ready."}</p>
      </main>
      {paused && (
        <PausePanel
          reason="user"
          motionIsSlow={true}
          onResume={() => setPaused(false)}
          onSlowDown={() => {}}
          onRestart={onRestart}
          onSettings={onOpenSettings}
          onLeave={onLeave}
        />
      )}
    </div>
  );
}

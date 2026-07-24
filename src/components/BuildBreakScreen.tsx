import { useCallback, useEffect, useRef, useState } from "react";
import { classifyKey } from "../game/input";
import type { MissionDefinition } from "../game/missions";
import { isOrdinaryTargetFamily } from "../game/targetTypes";
import { PausePanel } from "./PausePanel";
import { TargetCreature } from "./TargetCreature";

export const BUILD_BREAK_DURATION_MS = 30_000;

/** Each correct stationary label earns two Bits; a missed key reduces only the bonus. */
export function buildBreakBonus(completed: number, mistakes: number): number {
  return Math.max(0, completed * 2 - mistakes);
}

interface Props {
  mission: MissionDefinition;
  onFinish: (buildBits: number) => void;
  onRestart: () => void;
  onLeave: () => void;
  onOpenSettings: () => void;
}

interface Target {
  label: string;
  typed: number;
  index: number;
}

/** A stationary, optional word rush with no hearts or campaign side effects. */
export function BuildBreakScreen({ mission, onFinish, onRestart, onLeave, onOpenSettings }: Props) {
  const [paused, setPaused] = useState(false);
  const [target, setTarget] = useState<Target>(() => ({ label: mission.labels[0] ?? "a", typed: 0, index: 0 }));
  const [timeLeftMs, setTimeLeftMs] = useState(BUILD_BREAK_DURATION_MS);
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(target);
  const mistakesRef = useRef(0);
  const completedRef = useRef(0);
  const remainingRef = useRef(BUILD_BREAK_DURATION_MS);
  const endedRef = useRef(false);
  const family = mission.targetFamilies.find(isOrdinaryTargetFamily) ?? "pebble-puffer";

  const finish = useCallback((bonus?: number) => {
    if (endedRef.current) return;
    endedRef.current = true;
    onFinish(bonus ?? buildBreakBonus(completedRef.current, mistakesRef.current));
  }, [onFinish]);

  useEffect(() => {
    if (paused || endedRef.current) return;
    let cancelled = false;
    let rafId = 0;
    let previous: number | null = null;
    const tick = (now: number) => {
      if (cancelled) return;
      if (previous !== null) {
        const elapsed = Math.min(Math.max(now - previous, 0), 100);
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        if (remainingRef.current === 0) {
          finish();
          return;
        }
        setTimeLeftMs(remainingRef.current);
      }
      previous = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [finish, paused]);

  useEffect(() => {
    if (!paused) containerRef.current?.focus();
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
    const current = targetRef.current;
    if (action.char !== current.label[current.typed]) {
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      return;
    }
    const nextTyped = current.typed + 1;
    if (nextTyped < current.label.length) {
      const next = { ...current, typed: nextTyped };
      targetRef.current = next;
      setTarget(next);
      return;
    }
    completedRef.current += 1;
    setCompleted(completedRef.current);
    const index = (current.index + 1) % mission.labels.length;
    const next = { label: mission.labels[index] ?? current.label, typed: 0, index };
    targetRef.current = next;
    setTarget(next);
  }, [mission.labels, paused]);

  const seconds = Math.ceil(timeLeftMs / 1000);
  const potential = buildBreakBonus(completed, mistakes);

  return (
    <div ref={containerRef} className="screen build-break-screen" tabIndex={0} onKeyDown={handleKeyDown} aria-label="Build Break bonus round">
      <div className="practice-header">
        <div>
          <span className="practice-kicker">Optional Build Break</span>
          <strong>Stationary label rush</strong>
        </div>
        <button className="btn btn-small" onClick={() => finish(0)}>Skip Build Break</button>
      </div>
      <main className="practice-main">
        <div className="build-break-stats" aria-label={`${seconds} seconds left. Potential bonus ${potential} Build Bits.`}>
          <strong>{seconds}s</strong><span>Potential bonus: ◆ {potential}</span>
        </div>
        <p>Clear stationary labels. A missed key only lowers this bonus.</p>
        <div className="practice-target" aria-live="polite">
          <div className="label-plate practice-label">
            {target.label.split("").map((character, index) => (
              <span key={`${character}-${index}`} className={index < target.typed ? "typed" : index === target.typed ? "next" : ""}>
                {character}
              </span>
            ))}
          </div>
          <TargetCreature family={family} variant={target.index} />
        </div>
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

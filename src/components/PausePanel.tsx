import type { PauseReason } from "../state/machine";

interface Props {
  reason: PauseReason;
  motionIsSlow: boolean;
  onResume: () => void;
  onSlowDown: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onLeave: () => void;
}

const REASON_TEXT: Record<PauseReason, string> = {
  user: "Paused. Take your time!",
  auto: "The game paused itself to keep your spot safe.",
  reminder: "Time for a little stretch! Ready for more?",
};

export function PausePanel({
  reason,
  motionIsSlow,
  onResume,
  onSlowDown,
  onRestart,
  onSettings,
  onLeave,
}: Props) {
  return (
    <div className="overlay pause-overlay" role="dialog" aria-modal="true" aria-label="Paused">
      <div className="menu-card">
        <h1>Paused</h1>
        <p>{REASON_TEXT[reason]}</p>
        <div className="button-col">
          <button className="btn btn-primary btn-big" onClick={onResume} autoFocus>
            Resume
          </button>
          {!motionIsSlow && (
            <button className="btn" onClick={onSlowDown}>
              Slow Down
            </button>
          )}
          <button className="btn" onClick={onRestart}>
            Restart
          </button>
          <button className="btn" onClick={onSettings}>
            Settings
          </button>
          <button className="btn" onClick={onLeave}>
            Leave Mission
          </button>
        </div>
        <p className="hint-text">Press Enter or Space to resume.</p>
      </div>
    </div>
  );
}

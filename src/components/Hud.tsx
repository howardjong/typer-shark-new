interface Props {
  hearts: number;
  maxHearts: number;
  timeLeftMs: number;
  buildBits: number;
  streak: number;
  onPause: () => void;
}

export function Hud({ hearts, maxHearts, timeLeftMs, buildBits, streak, onPause }: Props) {
  const totalSec = Math.ceil(timeLeftMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = String(totalSec % 60).padStart(2, "0");

  return (
    <div className="hud">
      <div className="hud-left">
        <span className="hud-hearts" aria-label={`Shield hearts: ${hearts} of ${maxHearts}`}>
          {Array.from({ length: maxHearts }, (_, i) => (
            <span key={i} className={`heart ${i < hearts ? "full" : "empty"}`} aria-hidden="true">
              {i < hearts ? "♥" : "♡"}
            </span>
          ))}
          <span className="heart-text">
            {hearts}/{maxHearts}
          </span>
        </span>
      </div>
      <div className="hud-center">
        <span className="hud-timer" aria-label={`Time left: ${mm} minutes ${ss} seconds`}>
          {mm}:{ss}
        </span>
      </div>
      <div className="hud-right">
        {streak >= 2 && (
          <span className="hud-streak" aria-label={`Streak: ${streak}`}>
            ⚡ {streak}
          </span>
        )}
        <span className="hud-bits" aria-label={`Build Bits: ${buildBits}`}>
          ◆ {buildBits}
        </span>
        <button className="btn btn-small" onClick={onPause}>
          Pause
        </button>
      </div>
    </div>
  );
}

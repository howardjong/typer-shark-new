import { useEffect, useState } from "react";
import { classifyKey } from "../game/input";

const CHECK_LETTER = "j";

interface Props {
  onDetected: () => void;
  onBack: () => void;
}

/**
 * One friendly prompt to press a shown letter. If no usable key arrives,
 * explain that a physical keyboard is needed — menus stay mouse-usable.
 */
export function KeyboardCheck({ onDetected, onBack }: Props) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const action = classifyKey(e);
      if (action.kind === "char" && action.char === CHECK_LETTER) {
        e.preventDefault();
        onDetected();
      }
    };
    window.addEventListener("keydown", handler);
    const helpTimer = window.setTimeout(() => setShowHelp(true), 8000);
    return () => {
      window.removeEventListener("keydown", handler);
      window.clearTimeout(helpTimer);
    };
  }, [onDetected]);

  return (
    <div className="screen menu-screen">
      <div className="menu-card">
        <h1>Keyboard check</h1>
        <p>Press this letter on your keyboard:</p>
        <div className="label-plate big-plate" aria-label={`Press the letter ${CHECK_LETTER}`}>
          <span className="next">{CHECK_LETTER}</span>
        </div>
        {showHelp && (
          <p className="hint-text" role="status">
            No key press yet — Block Reef needs a physical keyboard to play.
            You can still look around the menus.
          </p>
        )}
        <div className="button-col">
          <button className="btn" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

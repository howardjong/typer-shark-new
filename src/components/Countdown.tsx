import { useEffect, useState } from "react";
import { audio } from "../audio/audio";

interface Props {
  resuming: boolean;
  onDone: () => void;
}

/** Visible three-second countdown before play starts or resumes. */
export function Countdown({ resuming, onDone }: Props) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    audio.play("countdown");
    if (count <= 0) {
      onDone();
      return;
    }
    const t = window.setTimeout(() => setCount((c) => c - 1), 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <div className="countdown-overlay" role="status" aria-live="assertive">
      <p className="countdown-label">{resuming ? "Back in…" : "Get ready…"}</p>
      <p className="countdown-number">{count > 0 ? count : "Go!"}</p>
    </div>
  );
}

import { keyCampFingerHint } from "../game/keyCampLessons";

const KEY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

interface Props {
  nextKey: string;
}

/** Visual teaching aid; the actual typed target remains separate DOM text. */
export function KeyboardGuide({ nextKey }: Props) {
  return (
    <div className="keyboard-guide" aria-label={`On-screen keyboard. Next key: ${nextKey}. Try your ${keyCampFingerHint(nextKey)}.`}>
      <div className="keyboard-rows" aria-hidden="true">
        {KEY_ROWS.map((row, index) => (
          <div className={`keyboard-row row-${index}`} key={row.join("")}>
            {row.map((key) => <span className={`keyboard-key${key === nextKey ? " active" : ""}`} key={key}>{key}</span>)}
          </div>
        ))}
      </div>
      <div className="hand-guide" aria-hidden="true"><span className="hand left-hand" /><span className="hand right-hand" /></div>
      <p className="finger-hint">Try your <strong>{keyCampFingerHint(nextKey)}</strong>.</p>
    </div>
  );
}

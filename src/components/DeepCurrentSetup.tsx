import { DIFFICULTIES, DifficultyId } from "../game/config";

interface Props {
  selectedDifficulty: DifficultyId;
  onPick: (difficulty: DifficultyId) => void;
  onStart: () => void;
  onBack: () => void;
}

/** Deep Current repeats the difficulty choice so its pace is explicit before play. */
export function DeepCurrentSetup({ selectedDifficulty, onPick, onStart, onBack }: Props) {
  return (
    <div className="screen menu-screen">
      <div className="menu-card wide">
        <p className="eyebrow">Optional endless challenge</p>
        <h1>Deep Current</h1>
        <p>Travel as far as you like. Every 60 seconds, the current offers a gentle breather.</p>
        <div className="difficulty-row" aria-label="Choose Deep Current pace">
          {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((id) => {
            const difficulty = DIFFICULTIES[id];
            return (
              <button
                key={id}
                className={`difficulty-card diff-${id}${id === selectedDifficulty ? " selected" : ""}`}
                onClick={() => onPick(id)}
                aria-pressed={id === selectedDifficulty}
              >
                <span className="difficulty-name">{difficulty.label}</span>
                <span className="difficulty-desc">{difficulty.description}</span>
              </button>
            );
          })}
        </div>
        <div className="button-col">
          <button className="btn btn-primary btn-big" onClick={onStart} autoFocus>Start Deep Current</button>
          <button className="btn" onClick={onBack}>Return to Map</button>
        </div>
      </div>
    </div>
  );
}

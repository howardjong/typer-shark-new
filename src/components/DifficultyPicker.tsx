import { DIFFICULTIES, DifficultyId } from "../game/config";

interface Props {
  onPick: (difficulty: DifficultyId) => void;
  onBack: () => void;
}

export function DifficultyPicker({ onPick, onBack }: Props) {
  return (
    <div className="screen menu-screen">
      <div className="menu-card wide">
        <h1>Which feels best today?</h1>
        <div className="difficulty-row">
          {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((id) => {
            const d = DIFFICULTIES[id];
            return (
              <button
                key={id}
                className={`difficulty-card diff-${id}`}
                onClick={() => onPick(id)}
                autoFocus={id === "starter"}
              >
                <span className="difficulty-name">{d.label}</span>
                <span className="difficulty-desc">{d.description}</span>
              </button>
            );
          })}
        </div>
        <div className="button-col">
          <button className="btn" onClick={onBack}>
            Back
          </button>
        </div>
        <p className="hint-text">You can change this any time from the pause menu.</p>
      </div>
    </div>
  );
}

import type { DifficultyConfig } from "../game/config";
import type { LessonDefinition } from "../game/wordBanks";

interface Props {
  lesson: LessonDefinition;
  difficulty: DifficultyConfig;
  onStart: () => void;
  onBack: () => void;
}

export function Briefing({ lesson, difficulty, onStart, onBack }: Props) {
  return (
    <div className="screen menu-screen">
      <div className="menu-card">
        <h1>{lesson.title}</h1>
        <p className="lesson-label">{lesson.lessonLabel}</p>
        <p>
          When a friendly fish swims in, press the letter on its label to send
          it gently back into the current.
        </p>
        <div className="briefing-example" aria-hidden="true">
          <div className="label-plate big-plate">
            <span className="next">f</span>
          </div>
          <span className="briefing-arrow">←</span>
          <span className="briefing-note">Press this letter!</span>
        </div>
        <p className="hint-text">
          Playing on <strong>{difficulty.label}</strong> · Keep your hands on
          the keyboard · Press Escape to pause any time
        </p>
        <div className="button-col">
          <button className="btn btn-primary btn-big" onClick={onStart} autoFocus>
            Start
          </button>
          <button className="btn" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

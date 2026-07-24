import type { DifficultyConfig } from "../game/config";
import type { MissionDefinition } from "../game/missions";
import type { RunPolicy } from "../state/machine";

interface Props {
  mission: MissionDefinition;
  difficulty: DifficultyConfig;
  runPolicy: RunPolicy;
  onStart: () => void;
  onBack: () => void;
}

export function Briefing({ mission, difficulty, runPolicy, onStart, onBack }: Props) {
  const example = mission.labels[0] ?? "a";
  const gate = mission.kind === "current-gate";

  return (
    <div className="screen menu-screen">
      <div className="menu-card">
        <p className="eyebrow">Adventure Trail</p>
        <h1>{mission.title}</h1>
        <p className="lesson-label">{mission.lessonLabel}</p>
        <p>{mission.description}</p>
        <div className="briefing-example" aria-hidden="true">
          <div className="label-plate big-plate">
            {example.split("").map((letter, index) => (
              <span className={index === 0 ? "next" : ""} key={`${letter}-${index}`}>
                {letter}
              </span>
            ))}
          </div>
          <span className="briefing-arrow">←</span>
          <span className="briefing-note">{gate ? "Redirect this label!" : "Type this label!"}</span>
        </div>
        <p className="hint-text">
          {runPolicy === "practice"
            ? "Practise without a timer · Take one stationary label at a time · Press Escape to pause"
            : <>Playing on <strong>{difficulty.label}</strong> · Keep your hands on the keyboard · Press Escape to pause any time</>}
        </p>
        <div className="button-col">
          <button className="btn btn-primary btn-big" onClick={onStart} autoFocus>
            {runPolicy === "practice" ? "Start Practise" : "Start Mission"}
          </button>
          <button className="btn" onClick={onBack}>
            Return to Map
          </button>
        </div>
      </div>
    </div>
  );
}

import type { MissionDefinition } from "../game/missions";

interface Props {
  mission: MissionDefinition;
  onContinue: () => void;
}

/** A calm, optional bridge between a completed Current Gate and its results. */
export function GateCelebration({ mission, onContinue }: Props) {
  return (
    <div className="screen gate-celebration" aria-label="Region build celebration">
      <div className="menu-card celebration-card">
        <p className="eyebrow">Region restored</p>
        <h1>{mission.title} is steady!</h1>
        <p>A bright reef marker rises in Pebble Bay to celebrate the path you opened.</p>
        <div className="celebration-build" aria-hidden="true">
          <span className="celebration-block" />
          <span className="celebration-block" />
          <span className="celebration-block" />
          <span className="celebration-block" />
          <span className="celebration-block" />
        </div>
        <p className="hint-text">This short scene is optional. You can continue whenever you are ready.</p>
        <div className="button-col">
          <button className="btn btn-primary btn-big" onClick={onContinue} autoFocus>See Results</button>
          <button className="btn" onClick={onContinue}>Skip Celebration</button>
        </div>
      </div>
    </div>
  );
}

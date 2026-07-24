interface Props {
  distance: number;
  bestDistance: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onMap: () => void;
}

export function DeepCurrentResults({ distance, bestDistance, isNewBest, onPlayAgain, onMap }: Props) {
  return (
    <div className="screen menu-screen">
      <div className="menu-card results-card">
        <p className="eyebrow">Deep Current</p>
        <h1>{isNewBest ? "New distance best!" : "Current complete"}</h1>
        <p>{isNewBest ? "You found a confident, steady rhythm." : "Nice swimming. Your best distance is waiting for another try."}</p>
        <dl className="stats-list">
          <div className="stat-row stat-primary"><dt>This run</dt><dd>{distance}m</dd></div>
          <div className="stat-row"><dt>Personal best</dt><dd>{bestDistance}m</dd></div>
        </dl>
        <div className="button-col">
          <button className="btn btn-primary btn-big" onClick={onPlayAgain} autoFocus>Swim Again</button>
          <button className="btn" onClick={onMap}>Return to Map</button>
        </div>
      </div>
    </div>
  );
}

import type { EngineSnapshot, MissionOutcome } from "../game/engine";
import { accuracyPct, formatStat, wordsPerMinute } from "../game/stats";

interface Props {
  outcome: MissionOutcome;
  stats: EngineSnapshot;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function ResultsCard({ outcome, stats, onPlayAgain, onHome }: Props) {
  const accuracy = accuracyPct(stats.correct, stats.accepted);
  const wpm = wordsPerMinute(stats.correct, stats.activeMs);
  const success = outcome === "success";

  return (
    <div className="screen menu-screen">
      <div className="menu-card results-card">
        <h1>{success ? "Reef protected!" : "Let’s try that path again"}</h1>
        <p>
          {success
            ? accuracy !== null && accuracy >= 90
              ? "Great accuracy! The reef builders are cheering."
              : "Nice swimming! Every letter helps the reef grow."
            : "The reef is safe — take a breath and dive back in when you’re ready."}
        </p>
        <dl className="stats-list">
          <div className="stat-row stat-primary">
            <dt>Accuracy</dt>
            <dd>{formatStat(accuracy, "%")}</dd>
          </div>
          <div className="stat-row">
            <dt>Words per minute</dt>
            <dd>{formatStat(wpm)}</dd>
          </div>
          <div className="stat-row">
            <dt>Words cleared</dt>
            <dd>{stats.completed}</dd>
          </div>
          <div className="stat-row">
            <dt>Best streak</dt>
            <dd>{stats.bestStreak}</dd>
          </div>
          <div className="stat-row">
            <dt>Build Bits</dt>
            <dd>{stats.buildBits}</dd>
          </div>
        </dl>
        <div className="button-col">
          <button className="btn btn-primary btn-big" onClick={onPlayAgain} autoFocus>
            {success ? "Play Again" : "Restart"}
          </button>
          <button className="btn" onClick={onHome}>
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

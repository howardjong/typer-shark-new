import type { EngineSnapshot, MissionOutcome } from "../game/engine";
import { accuracyPct, formatStat, wordsPerMinute } from "../game/stats";
import type { RunPolicy } from "../state/machine";

interface Props {
  outcome: MissionOutcome;
  runPolicy: RunPolicy;
  stats: EngineSnapshot;
  onPlayAgain: () => void;
  onPractice?: () => void;
  onBuildBreak?: () => void;
  onMap: () => void;
}

export function ResultsCard({ outcome, runPolicy, stats, onPlayAgain, onPractice, onBuildBreak, onMap }: Props) {
  const accuracy = accuracyPct(stats.correct, stats.accepted);
  const wpm = wordsPerMinute(stats.correct, stats.activeMs);
  const success = outcome === "success";
  const practice = runPolicy === "practice";

  return (
    <div className="screen menu-screen">
      <div className="menu-card results-card">
        <h1>{practice ? "Practise complete!" : success ? "Reef protected!" : "Let’s try that path again"}</h1>
        <p>
          {practice
            ? accuracy !== null && accuracy >= 90
              ? "Great accuracy! You can repeat this lesson whenever you like."
              : "Nice careful practice. Every label helps your hands learn the path."
            : success
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
          {!practice && <>
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
          </>}
        </dl>
        <div className="button-col">
          <button className="btn btn-primary btn-big" onClick={onPlayAgain} autoFocus>
            {practice ? "Repeat Practise" : success ? "Replay This Mission" : "Restart"}
          </button>
          {!practice && onPractice && (
            <button className="btn" onClick={onPractice}>Practise without timer</button>
          )}
          {!practice && success && onBuildBreak && (
            <button className="btn" onClick={onBuildBreak}>Try a Build Break</button>
          )}
          <button className="btn" onClick={onMap}>
            {practice || !success ? "Return to Map" : "Choose Next Path"}
          </button>
        </div>
      </div>
    </div>
  );
}

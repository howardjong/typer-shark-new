import type { DifficultyId } from "../game/config";
import { MISSIONS } from "../game/missions";
import type { RegionId } from "../game/missions";
import type { Progress } from "../state/progress";

interface Props {
  difficulty: DifficultyId;
  progress: Progress;
  onSelectMission: (missionId: (typeof MISSIONS)[number]["id"]) => void;
  onPracticeMission: (missionId: (typeof MISSIONS)[number]["id"]) => void;
  onBack: () => void;
}

const REGION_INFO: Record<RegionId, { title: string; description: string }> = {
  "sunlit-shelf": { title: "Sunlit Shelf", description: "Warm sand and gentle first currents." },
  "kelp-cubes": { title: "Kelp Cubes", description: "Careful word pairs among the kelp." },
  "crystal-current": { title: "Crystal Current", description: "Clear, confident reading in crystal caves." },
};

const REGIONS: readonly RegionId[] = ["sunlit-shelf", "kelp-cubes", "crystal-current"];

export function AdventureMap({
  difficulty,
  progress,
  onSelectMission,
  onPracticeMission,
  onBack,
}: Props) {
  const unlocked = new Set(progress.unlockedMissionIds);

  return (
    <div className="screen menu-screen adventure-map-screen">
      <div className="map-card">
        <h1>Adventure Trail</h1>
        <p className="map-intro">
          Choose a bright path for today. Playing on <strong>{difficulty}</strong> pace.
        </p>
        <div className="region-list">
          {REGIONS.map((region) => (
            <section className={`region-card region-${region}`} key={region} aria-labelledby={`${region}-title`}>
              <h2 id={`${region}-title`}>{REGION_INFO[region].title}</h2>
              <p>{REGION_INFO[region].description}</p>
              <div className="mission-list">
                {MISSIONS.filter((mission) => mission.region === region).map((mission) => {
                  const available = unlocked.has(mission.id);
                  const completed = progress.completedMissions.includes(mission.id);
                  const playable = available;
                  return (
                    <div className="mission-action" key={mission.id}>
                      <button
                        className={`mission-card${playable ? " available" : " locked"}${completed ? " completed" : ""}`}
                        disabled={!playable}
                        onClick={() => onSelectMission(mission.id)}
                        aria-label={
                          playable
                            ? `${mission.title}${completed ? ", completed and replayable" : ", ready to play"}`
                            : `${mission.title}, locked until an earlier path is complete`
                        }
                      >
                        <span className="mission-marker" aria-hidden="true">
                          {completed ? "◆" : playable ? "●" : "○"}
                        </span>
                        <span className="mission-card-copy">
                          <strong>{mission.title}</strong>
                          <span>{mission.kind === "current-gate" ? "Current Gate" : mission.lessonLabel}</span>
                        </span>
                      </button>
                      {available && mission.kind === "regular" && (
                        <button className="mission-practice" onClick={() => onPracticeMission(mission.id)}>
                          Practise without timer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <p className="build-bits-total">Build Bits collected: <strong>{progress.buildBits}</strong></p>
        <div className="button-col">
          <button className="btn" onClick={onBack}>Return Home</button>
        </div>
      </div>
    </div>
  );
}

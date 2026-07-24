interface Props {
  pieces: readonly string[];
}

/** Cosmetic-only, deterministic settlement view for earned campaign pieces. */
export function PebbleBayBuilds({ pieces }: Props) {
  return (
    <section className="pebble-bay-builds" aria-labelledby="pebble-bay-title">
      <h2 id="pebble-bay-title">Pebble Bay builds</h2>
      {pieces.length === 0 ? (
        <p>Your first mission piece will appear here.</p>
      ) : (
        <>
          <div className="pebble-bay-scene" aria-hidden="true">
            <span className="bay-piece base-piece" />
            {pieces.map((piece, index) => <span className={`bay-piece reward-piece reward-${index % 5}`} key={piece} />)}
          </div>
          <p>{pieces.join(" · ")}</p>
        </>
      )}
    </section>
  );
}

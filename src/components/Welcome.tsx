interface Props {
  buildBits: number;
  onPlay: () => void;
  onKeyCamp: () => void;
  onSettings: () => void;
}

export function Welcome({ buildBits, onPlay, onKeyCamp, onSettings }: Props) {
  return (
    <div className="screen menu-screen welcome">
      <div className="menu-card">
        <div className="logo-blocks" aria-hidden="true">
          <span className="block b1" />
          <span className="block b2" />
          <span className="block b3" />
        </div>
        <h1 className="game-title">Block Reef</h1>
        <p className="game-subtitle">Typing Quest</p>
        <p className="tagline">
          Type the labels to protect the reef and collect building blocks.
        </p>
        <div className="button-col">
          <button className="btn btn-primary btn-big" onClick={onPlay} autoFocus>
            Play
          </button>
          <button className="btn" onClick={onKeyCamp}>
            Key Camp
          </button>
          <button className="btn" onClick={onSettings}>
            Settings
          </button>
        </div>
        <p className="hint-text">Use a keyboard to type the labels.</p>
        {buildBits > 0 && (
          <p className="build-bits-total">
            Build Bits collected: <strong>{buildBits}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

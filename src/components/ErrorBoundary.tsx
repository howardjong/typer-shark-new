import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Calm, child-friendly recovery panel. Never shows a stack trace to the
 * child; the error is logged to the console for developers.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error("Block Reef recovered from an error:", error);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="recovery-panel" role="alert">
        <div className="recovery-card">
          <h1>Oops, a big wave!</h1>
          <p>Something got tangled in the kelp. Your reef is safe.</p>
          <div className="button-row">
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Restart Game
            </button>
          </div>
        </div>
      </div>
    );
  }
}

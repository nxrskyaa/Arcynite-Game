import type { RunResult } from "../game/types";
import AssetImage from "./AssetImage";
import SubmitScorePanel from "./SubmitScorePanel";

type GameOverModalProps = {
  result: RunResult;
  submitted: boolean;
  submitting: boolean;
  submitError?: string;
  onchainBest?: bigint;
  onSubmitScore: () => void;
  onRestart: () => void;
  onMenu: () => void;
};

export default function GameOverModal({ result, submitted, submitting, submitError, onchainBest, onSubmitScore, onRestart, onMenu }: GameOverModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="pixel-panel gameover-panel">
        <AssetImage filename={submitted ? "player_celebrate_sheet.png" : "player_fall.png"} alt="" className="gameover-mascot" />
        <span className="eyebrow">{submitted ? "Score Anchored" : "Run Complete"}</span>
        <h2>{result.score.toLocaleString()} pts</h2>
        <div className="summary-grid">
          <span>Eggs</span>
          <strong>{result.eggsCollected}</strong>
          <span>Combo</span>
          <strong>{result.combo}</strong>
          <span>Duration</span>
          <strong>{result.durationSeconds}s</strong>
          <span>Local Best</span>
          <strong>{result.localBest.toLocaleString()}</strong>
          <span>Onchain Best</span>
          <strong>{(onchainBest ?? 0n).toLocaleString()}</strong>
        </div>
        <SubmitScorePanel
          submitted={submitted}
          submitting={submitting}
          error={submitError}
          onSubmitScore={onSubmitScore}
        />
        <div className="button-row">
          <button type="button" className="ghost-button" onClick={onRestart}>Retry</button>
          <button type="button" className="ghost-button" onClick={onMenu}>Menu</button>
        </div>
      </div>
    </div>
  );
}

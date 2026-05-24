type SubmitScorePanelProps = {
  submitted: boolean;
  submitting: boolean;
  error?: string;
  onSubmitScore: () => void;
};

export default function SubmitScorePanel({ submitted, submitting, error, onSubmitScore }: SubmitScorePanelProps) {
  if (submitted) {
    return <p className="success-text">Score submitted on Arc Testnet.</p>;
  }

  return (
    <div className="submit-panel">
      <button className="primary-button" type="button" onClick={onSubmitScore} disabled={submitting}>
        {submitting ? "Submitting Score..." : "Submit Score Onchain"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

import AssetImage from "./AssetImage";

type HUDProps = {
  score: number;
  eggs: number;
  combo: number;
  round: number;
  localBest: number;
  maxScore: number;
};

export default function HUD({ score, eggs, combo, round, localBest, maxScore }: HUDProps) {
  return (
    <div className="hud">
      <div className="hud-pill">
        <span>Score</span>
        <strong>{score.toLocaleString()}</strong>
      </div>
      <div className="hud-pill">
        <AssetImage filename="ui_icon_egg.png" alt="" className="hud-icon" />
        <strong>{eggs}</strong>
      </div>
      <div className="hud-pill">
        <AssetImage filename="ui_icon_combo_sparkle.png" alt="" className="hud-icon" />
        <strong>x{Math.max(1, combo)}</strong>
      </div>
      <div className="hud-pill">
        <span>Run</span>
        <strong>{round}</strong>
      </div>
      <div className="hud-pill compact">
        <span>Best {localBest.toLocaleString()}</span>
        <span>Cap {maxScore.toLocaleString()}</span>
      </div>
    </div>
  );
}

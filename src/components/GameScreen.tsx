import { useEffect } from "react";
import type { CSSProperties } from "react";
import type { RunResult } from "../game/types";
import { useGameState } from "../game/useGameState";
import AssetImage from "./AssetImage";
import GameOverModal from "./GameOverModal";
import HUD from "./HUD";

type GameScreenProps = {
  maxScorePerRun?: bigint;
  submitted: boolean;
  submitting: boolean;
  submitError?: string;
  onSubmitScore: (result: RunResult) => void;
  onExitToMenu: () => void;
};

const poseAsset = {
  idle: "player_idle.png",
  jump_start: "player_jump_start.png",
  midair: "player_jump_midair.png",
  landing: "player_landing.png",
  fall: "player_fall.png",
  celebrate: "player_celebrate_sheet.png",
} as const;

export default function GameScreen({ maxScorePerRun, submitted, submitting, submitError, onSubmitScore, onExitToMenu }: GameScreenProps) {
  const game = useGameState(maxScorePerRun);

  useEffect(() => {
    game.startRun();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        game.attemptJump();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [game]);

  return (
    <section className="game-screen" onPointerDown={() => game.attemptJump()}>
      <HUD
        score={game.score}
        eggs={game.eggsCollected}
        combo={game.combo}
        round={game.round}
        localBest={game.localBest}
        maxScore={game.maxScorePerRun}
      />
      <div className="sky-props" aria-hidden="true">
        <AssetImage filename="prop_cloud_small.png" alt="" className="cloud cloud-one" />
        <AssetImage filename="prop_cloud_small.png" alt="" className="cloud cloud-two" />
        <AssetImage filename="object_arcane_portal.png" alt="" className="tiny-portal" />
      </div>
      <div className="playfield">
        <AssetImage filename="platform_normal.png" alt="" className="platform current-platform" />
        <AssetImage
          filename={game.targetPlatform.risky ? "platform_cracked.png" : "platform_target.png"}
          alt=""
          className="platform target-platform"
          style={{ left: `${game.targetPlatform.x}%`, top: `${game.targetPlatform.y}%` } as CSSProperties}
        />
        {game.targetPlatform.egg !== "none" && (
          <AssetImage
            filename={game.targetPlatform.egg === "crystal" ? "egg_crystal_rare.png" : "egg_gold.png"}
            alt=""
            className="floating-egg"
            style={{ left: `${game.targetPlatform.x + 6}%`, top: `${game.targetPlatform.y - 12}%` } as CSSProperties}
          />
        )}
        <AssetImage filename="fx_target_pulse_ring.png" alt="" className="target-ring" />
        <AssetImage filename="fx_dash_trail.png" alt="" className={game.phase === "jumping" ? "dash-trail active" : "dash-trail"} />
        <AssetImage filename={poseAsset[game.pose]} alt="Player" className={`player-sprite pose-${game.pose}`} />
      </div>
      <div className="timing-bar" aria-label="Dash timing meter">
        <div className="timing-zone" style={{ width: `${game.timingWindow}%`, left: `${50 - game.timingWindow / 2}%` }} />
        <div className="timing-needle" style={{ left: `${game.meter}%` }} />
      </div>
      <p className="tap-hint">Tap, click, or press Space when the needle hits the glow.</p>
      {game.result && (
        <GameOverModal
          result={game.result}
          submitted={submitted}
          submitting={submitting}
          submitError={submitError}
          onSubmitScore={() => onSubmitScore(game.result!)}
          onRestart={game.startRun}
          onMenu={() => {
            game.resetToMenu();
            onExitToMenu();
          }}
        />
      )}
    </section>
  );
}

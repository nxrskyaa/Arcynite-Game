import { useEffect } from "react";
import type { CSSProperties } from "react";
import type { RunResult } from "../game/types";
import { PLAYER_HEIGHT, PLAYER_WIDTH } from "../game/level";
import { useArcyniteRun } from "../game/useArcyniteRun";
import AssetImage from "./AssetImage";
import GameOverModal from "./GameOverModal";
import HUD from "./HUD";

type GameScreenProps = {
  maxScorePerRun?: bigint;
  submitted: boolean;
  submitting: boolean;
  submitError?: string;
  onchainBest?: bigint;
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

function platformAsset(type: string) {
  if (type === "cracked") return "platform_cracked.png";
  if (type === "target") return "platform_target.png";
  return "platform_normal.png";
}

function eggPosition(currentX: number, currentY: number, targetX: number, targetY: number) {
  return {
    x: (currentX + targetX) * 0.5 + 80,
    y: Math.min(currentY, targetY) - 120,
  };
}

export default function GameScreen({ maxScorePerRun, submitted, submitting, submitError, onchainBest, onSubmitScore, onExitToMenu }: GameScreenProps) {
  const game = useArcyniteRun(maxScorePerRun);

  useEffect(() => {
    game.startRun();
  }, [game.startRun]);

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

  const current = game.currentPlatform;
  const target = game.targetPlatform;
  const egg = eggPosition(current.x, current.y, target.x, target.y);
  const playerCenter = {
    x: game.player.x + PLAYER_WIDTH * 0.5,
    y: game.player.y + PLAYER_HEIGHT * 0.56,
  };
  const aimStyle = {
    left: playerCenter.x,
    top: playerCenter.y,
    transform: `translate(-50%, -50%) rotate(${game.aimAngle}rad)`,
  } as CSSProperties;

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
        <div className="world-layer" style={{ width: game.arena.width, height: game.arena.height } as CSSProperties}>
          <AssetImage
            filename={platformAsset(current.type)}
            alt=""
            className="platform world-platform"
            style={{ left: current.x, top: current.y, width: current.width } as CSSProperties}
          />
          <AssetImage
            filename={platformAsset(target.type)}
            alt=""
            className="platform world-platform target-platform"
            style={{ left: target.x, top: target.y, width: target.width } as CSSProperties}
          />
          <AssetImage
            filename="fx_target_pulse_ring.png"
            alt=""
            className="target-ring"
            style={{ left: target.x + target.width * 0.5, top: target.y + 22 } as CSSProperties}
          />
          {!target.eggCollected && target.eggType !== "none" && (
            <AssetImage
              filename={target.eggType === "crystal" ? "egg_crystal_rare.png" : "egg_gold.png"}
              alt=""
              className="floating-egg"
              style={{ left: egg.x, top: egg.y } as CSSProperties}
            />
          )}
          <div className="target-angle-window" style={{
            left: playerCenter.x,
            top: playerCenter.y,
            transform: `translate(-50%, -50%) rotate(${Math.atan2(target.y + target.height * 0.45 - playerCenter.y, target.x + target.width * 0.5 - playerCenter.x)}rad)`,
          } as CSSProperties} />
          <div className="aim-system" style={aimStyle}>
            <div className="aim-arrow" />
          </div>
          {game.pickupFx.map((fx) => (
            <div className="pickup-fx" key={fx.id} style={{ left: fx.x, top: fx.y } as CSSProperties}>
              <AssetImage filename="fx_pickup_sparkle.png" alt="" />
              <span>{fx.label}</span>
            </div>
          ))}
          <AssetImage
            filename="fx_landing_dust.png"
            alt=""
            className={game.player.pose === "landing" ? "landing-dust active" : "landing-dust"}
            style={{ left: game.player.x + PLAYER_WIDTH * 0.5, top: game.player.y + PLAYER_HEIGHT - 18 } as CSSProperties}
          />
          <AssetImage
            filename="fx_dash_trail.png"
            alt=""
            className={game.phase === "dashing" ? "dash-trail active" : "dash-trail"}
            style={{ left: game.player.x - 120, top: game.player.y + 58 } as CSSProperties}
          />
          <AssetImage
            filename={poseAsset[game.player.pose]}
            alt="Player"
            className={`player-sprite pose-${game.player.pose}`}
            style={{ left: game.player.x, top: game.player.y, width: PLAYER_WIDTH } as CSSProperties}
          />
        </div>
      </div>
      <p className="tap-hint">Tap when aligned</p>
      {game.result && (
        <GameOverModal
          result={game.result}
          submitted={submitted}
          submitting={submitting}
          submitError={submitError}
          onchainBest={onchainBest}
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

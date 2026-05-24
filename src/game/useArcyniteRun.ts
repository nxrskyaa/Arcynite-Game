import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BASE_LANDING_SCORE, CRYSTAL_EGG_SCORE, DEFAULT_MAX_SCORE_PER_RUN, GOLD_EGG_SCORE, LOCAL_BEST_KEY } from "./constants";
import { firstPlatform, moveTargetPlatform, platformForRound, PLAYER_HEIGHT, PLAYER_WIDTH } from "./level";
import { scoreLanding, scorePickup } from "./scoring";
import type { GamePhase, JumpState, PickupFx, Platform, PlayerState, RunResult } from "./types";

const SAFE_FALL_Y = 820;
const LANDING_TOLERANCE = 64;

function playerOnPlatform(platform: Platform): PlayerState {
  return {
    x: platform.x + platform.width * 0.5 - PLAYER_WIDTH * 0.5,
    y: platform.y - PLAYER_HEIGHT + 18,
    pose: "idle",
  };
}

function platformCenter(platform: Platform) {
  return {
    x: platform.x + platform.width * 0.5,
    y: platform.y,
  };
}

function eggPosition(current: Platform, target: Platform) {
  return {
    x: (current.x + target.x) * 0.5 + 80,
    y: Math.min(current.y, target.y) - 120,
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function useArcyniteRun(maxScorePerRun?: bigint) {
  const cap = Number(maxScorePerRun ?? BigInt(DEFAULT_MAX_SCORE_PER_RUN));
  const startPlatform = useMemo(() => firstPlatform(), []);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [round, setRound] = useState(1);
  const [currentPlatform, setCurrentPlatform] = useState<Platform>(startPlatform);
  const [targetPlatform, setTargetPlatform] = useState<Platform>(() => platformForRound(1, startPlatform));
  const [player, setPlayer] = useState<PlayerState>(() => playerOnPlatform(startPlatform));
  const [jump, setJump] = useState<JumpState | null>(null);
  const [score, setScore] = useState(0);
  const [eggsCollected, setEggsCollected] = useState(0);
  const [combo, setCombo] = useState(0);
  const [cameraX, setCameraX] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [pickupFx, setPickupFx] = useState<PickupFx[]>([]);
  const [localBest, setLocalBest] = useState(() => Number(localStorage.getItem(LOCAL_BEST_KEY) ?? 0));
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef(targetPlatform);
  const currentRef = useRef(currentPlatform);
  const playerRef = useRef(player);
  const jumpRef = useRef<JumpState | null>(jump);
  const phaseRef = useRef<GamePhase>(phase);
  const scoreRef = useRef(score);
  const eggsRef = useRef(eggsCollected);
  const comboRef = useRef(combo);
  const localBestRef = useRef(localBest);

  useEffect(() => { targetRef.current = targetPlatform; }, [targetPlatform]);
  useEffect(() => { currentRef.current = currentPlatform; }, [currentPlatform]);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { jumpRef.current = jump; }, [jump]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { eggsRef.current = eggsCollected; }, [eggsCollected]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { localBestRef.current = localBest; }, [localBest]);

  const finishRun = useCallback((finalScore = scoreRef.current, finalEggs = eggsRef.current, finalCombo = comboRef.current) => {
    const durationSeconds = Math.max(1, Math.floor((Date.now() - (runStartedAt ?? Date.now())) / 1000));
    const nextBest = Math.max(localBestRef.current, finalScore);
    localStorage.setItem(LOCAL_BEST_KEY, String(nextBest));
    setLocalBest(nextBest);
    setResult({
      score: finalScore,
      eggsCollected: finalEggs,
      durationSeconds,
      combo: finalCombo,
      localBest: nextBest,
    });
    setPlayer((current) => ({ ...current, pose: "fall" }));
    setPhase("gameover");
  }, [runStartedAt]);

  const startRun = useCallback(() => {
    const first = firstPlatform();
    const target = platformForRound(1, first);
    setPhase("playing");
    setRound(1);
    setCurrentPlatform(first);
    setTargetPlatform(target);
    setPlayer(playerOnPlatform(first));
    setJump(null);
    setScore(0);
    setEggsCollected(0);
    setCombo(0);
    setCameraX(0);
    setRunStartedAt(Date.now());
    setResult(null);
    setPickupFx([]);
  }, []);

  const resetToMenu = useCallback(() => {
    setPhase("menu");
    setResult(null);
    setJump(null);
    setPlayer((current) => ({ ...current, pose: "idle" }));
  }, []);

  const attemptJump = useCallback(() => {
    if (phaseRef.current !== "playing" || jumpRef.current) return;

    const current = currentRef.current;
    const target = targetRef.current;
    const start = {
      x: playerRef.current.x,
      y: playerRef.current.y,
    };
    const targetCenter = platformCenter(target);
    const difficulty = Math.min(round * 4, 42);
    const aimError = (Math.random() - 0.5) * difficulty;
    const landX = targetCenter.x - PLAYER_WIDTH * 0.5 + aimError;
    const landY = target.y - PLAYER_HEIGHT + 18;
    const gap = Math.abs(targetCenter.x - platformCenter(current).x);
    const duration = Math.min(820, Math.max(560, gap * 1.15));

    setPlayer((state) => ({ ...state, pose: "midair" }));
    setJump({
      startX: start.x,
      startY: start.y,
      landX,
      landY,
      startedAt: performance.now(),
      duration,
      peak: Math.max(190, 130 + gap * 0.18),
    });
    setPhase("jumping");
  }, [round]);

  useEffect(() => {
    const tick = (time: number) => {
      if (phaseRef.current === "playing" || phaseRef.current === "jumping" || phaseRef.current === "falling") {
        const movedTarget = moveTargetPlatform(targetRef.current, time);
        targetRef.current = movedTarget;
        setTargetPlatform(movedTarget);

        const activeJump = jumpRef.current;
        if (activeJump) {
          const progress = Math.min(1, (time - activeJump.startedAt) / activeJump.duration);
          const x = activeJump.startX + (activeJump.landX - activeJump.startX) * progress;
          const arc = Math.sin(progress * Math.PI) * activeJump.peak;
          const y = activeJump.startY + (activeJump.landY - activeJump.startY) * progress - arc;
          const nextPlayer = { x, y, pose: progress < 0.86 ? "midair" as const : "landing" as const };
          playerRef.current = nextPlayer;
          setPlayer(nextPlayer);

          const egg = eggPosition(currentRef.current, movedTarget);
          if (!movedTarget.eggCollected && distance({ x: x + PLAYER_WIDTH * 0.5, y: y + PLAYER_HEIGHT * 0.45 }, egg) < 82) {
            const eggScore = movedTarget.eggType === "crystal" ? CRYSTAL_EGG_SCORE : GOLD_EGG_SCORE;
            const nextScore = scorePickup(comboRef.current, movedTarget.eggType, cap, scoreRef.current);
            scoreRef.current = nextScore;
            eggsRef.current += 1;
            targetRef.current = { ...movedTarget, eggCollected: true };
            setTargetPlatform(targetRef.current);
            setScore(nextScore);
            setEggsCollected(eggsRef.current);
            setPickupFx((items) => [...items.slice(-4), { id: time, x: egg.x, y: egg.y, label: `+${eggScore}` }]);
          }

          if (progress >= 1) {
            const liveTarget = targetRef.current;
            const playerFootX = x + PLAYER_WIDTH * 0.5;
            const targetLeft = liveTarget.x - LANDING_TOLERANCE;
            const targetRight = liveTarget.x + liveTarget.width + LANDING_TOLERANCE;
            const targetTop = liveTarget.y;
            const success = playerFootX >= targetLeft && playerFootX <= targetRight && Math.abs((y + PLAYER_HEIGHT - 18) - targetTop) < 80;
            setJump(null);
            jumpRef.current = null;

            if (!success) {
              setPhase("falling");
              setPlayer({ x, y, pose: "fall" });
              window.setTimeout(() => finishRun(), 360);
            } else {
              const nextCombo = comboRef.current + 1;
              const nextScore = scoreLanding(nextCombo, "none", cap, scoreRef.current);
              const landedPlatform = { ...liveTarget, type: "normal" as const, drift: 0, baseX: liveTarget.x, baseY: liveTarget.y };
              const nextTarget = platformForRound(round + 1, landedPlatform);
              comboRef.current = nextCombo;
              scoreRef.current = nextScore;
              setCombo(nextCombo);
              setScore(scoreRef.current);
              setCurrentPlatform(landedPlatform);
              setTargetPlatform(nextTarget);
              targetRef.current = nextTarget;
              currentRef.current = landedPlatform;
              setPlayer(playerOnPlatform(landedPlatform));
              setRound((value) => value + 1);
              setPhase(liveTarget.type === "cracked" ? "falling" : "playing");
              if (liveTarget.type === "cracked") {
                window.setTimeout(() => finishRun(scoreRef.current, eggsRef.current, comboRef.current), 520);
              }
            }
          }

          if (y > SAFE_FALL_Y) {
            setJump(null);
            jumpRef.current = null;
            finishRun();
          }
        }

        setCameraX((currentCamera) => {
          const desired = Math.max(0, playerRef.current.x - 260);
          return currentCamera + (desired - currentCamera) * 0.08;
        });
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [cap, finishRun, round]);

  useEffect(() => {
    if (pickupFx.length === 0) return;
    const timer = window.setTimeout(() => setPickupFx((items) => items.slice(1)), 700);
    return () => window.clearTimeout(timer);
  }, [pickupFx]);

  return {
    phase,
    round,
    score,
    eggsCollected,
    combo,
    player,
    currentPlatform,
    targetPlatform,
    cameraX,
    result,
    pickupFx,
    localBest,
    maxScorePerRun: cap,
    startRun,
    attemptJump,
    resetToMenu,
  };
}

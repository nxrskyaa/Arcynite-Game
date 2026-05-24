import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CRYSTAL_EGG_SCORE, DEFAULT_MAX_SCORE_PER_RUN, GOLD_EGG_SCORE, LOCAL_BEST_KEY } from "./constants";
import {
  AIM_RADIUS,
  ARENA_SIZE,
  createNextTargetNode,
  firstPlatform,
  getAimAngle,
  getTargetAngle,
  getTimingWindow,
  isTimingSuccess,
  moveTargetPlatform,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
} from "./level";
import { scoreLanding, scorePickup } from "./scoring";
import type { GamePhase, JumpState, PickupFx, Platform, PlayerState, RunResult } from "./types";

function platformPlayerPosition(platform: Platform): PlayerState {
  return {
    x: platform.x + platform.width * 0.5 - PLAYER_WIDTH * 0.5,
    y: platform.y - PLAYER_HEIGHT + 22,
    pose: "idle",
  };
}

function playerCenter(player: PlayerState) {
  return {
    x: player.x + PLAYER_WIDTH * 0.5,
    y: player.y + PLAYER_HEIGHT * 0.56,
  };
}

function eggPosition(current: Platform, target: Platform) {
  return {
    x: (current.x + target.x) * 0.5 + target.width * 0.55,
    y: Math.min(current.y, target.y) - 54,
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clampScoreCap(maxScorePerRun?: bigint) {
  return Math.min(1_000_000, Number(maxScorePerRun ?? BigInt(DEFAULT_MAX_SCORE_PER_RUN)));
}

export function useArcyniteRun(maxScorePerRun?: bigint) {
  const cap = clampScoreCap(maxScorePerRun);
  const first = useMemo(() => firstPlatform(), []);
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [round, setRound] = useState(1);
  const [currentPlatform, setCurrentPlatform] = useState<Platform>(first);
  const [targetPlatform, setTargetPlatform] = useState<Platform>(() => createNextTargetNode(1, first));
  const [player, setPlayer] = useState<PlayerState>(() => platformPlayerPosition(first));
  const [jump, setJump] = useState<JumpState | null>(null);
  const [aimAngle, setAimAngle] = useState(0);
  const [score, setScore] = useState(0);
  const [eggsCollected, setEggsCollected] = useState(0);
  const [combo, setCombo] = useState(0);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [pickupFx, setPickupFx] = useState<PickupFx[]>([]);
  const [localBest, setLocalBest] = useState(() => Number(localStorage.getItem(LOCAL_BEST_KEY) ?? 0));

  const frameRef = useRef<number | null>(null);
  const phaseRef = useRef<GamePhase>(phase);
  const roundRef = useRef(round);
  const currentRef = useRef(currentPlatform);
  const targetRef = useRef(targetPlatform);
  const playerRef = useRef(player);
  const jumpRef = useRef<JumpState | null>(jump);
  const aimRef = useRef(aimAngle);
  const scoreRef = useRef(score);
  const eggsRef = useRef(eggsCollected);
  const comboRef = useRef(combo);
  const localBestRef = useRef(localBest);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { currentRef.current = currentPlatform; }, [currentPlatform]);
  useEffect(() => { targetRef.current = targetPlatform; }, [targetPlatform]);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { jumpRef.current = jump; }, [jump]);
  useEffect(() => { aimRef.current = aimAngle; }, [aimAngle]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { eggsRef.current = eggsCollected; }, [eggsCollected]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { localBestRef.current = localBest; }, [localBest]);

  const failRun = useCallback(() => {
    const durationSeconds = Math.max(1, Math.floor((Date.now() - (runStartedAt ?? Date.now())) / 1000));
    const finalScore = scoreRef.current;
    const nextBest = Math.max(localBestRef.current, finalScore);
    localStorage.setItem(LOCAL_BEST_KEY, String(nextBest));
    setLocalBest(nextBest);
    setResult({
      score: finalScore,
      eggsCollected: eggsRef.current,
      durationSeconds,
      combo: comboRef.current,
      localBest: nextBest,
    });
    setPlayer((state) => ({ ...state, pose: "fall" }));
    setPhase("gameover");
  }, [runStartedAt]);

  const startRun = useCallback(() => {
    const start = firstPlatform();
    const target = createNextTargetNode(1, start);
    setPhase("aiming");
    setRound(1);
    setCurrentPlatform(start);
    setTargetPlatform(target);
    setPlayer(platformPlayerPosition(start));
    setJump(null);
    setAimAngle(getTargetAngle(playerCenter(platformPlayerPosition(start)), target));
    setScore(0);
    setEggsCollected(0);
    setCombo(0);
    setRunStartedAt(Date.now());
    setResult(null);
    setPickupFx([]);
  }, []);

  const resetToMenu = useCallback(() => {
    setPhase("ready");
    setResult(null);
    setJump(null);
    setPlayer((state) => ({ ...state, pose: "idle" }));
  }, []);

  const startDash = useCallback(() => {
    if (phaseRef.current !== "aiming" || jumpRef.current) return;

    const currentPlayer = playerRef.current;
    const currentCenter = playerCenter(currentPlayer);
    const target = targetRef.current;
    const targetAngle = getTargetAngle(currentCenter, target);
    const success = isTimingSuccess(aimRef.current, targetAngle, getTimingWindow(roundRef.current));
    const targetPlayer = platformPlayerPosition(target);
    const direction = success ? targetAngle : aimRef.current;
    const failDistance = 170;
    const landX = success ? targetPlayer.x : currentPlayer.x + Math.cos(direction) * failDistance;
    const landY = success ? targetPlayer.y : currentPlayer.y + Math.sin(direction) * failDistance + 120;

    setPlayer((state) => ({ ...state, pose: "midair" }));
    setJump({
      startX: currentPlayer.x,
      startY: currentPlayer.y,
      landX,
      landY,
      startedAt: performance.now(),
      duration: success ? Math.max(350, 640 - roundRef.current * 8) : 430,
      peak: success ? 115 : 70,
      fail: !success,
    });
    setPhase("dashing");
  }, []);

  useEffect(() => {
    const tick = (time: number) => {
      const activePhase = phaseRef.current;

      if (activePhase === "aiming") {
        const movedTarget = moveTargetPlatform(targetRef.current, time);
        targetRef.current = movedTarget;
        setTargetPlatform(movedTarget);
        const nextAim = getAimAngle(time, roundRef.current);
        aimRef.current = nextAim;
        setAimAngle(nextAim);
      }

      const activeJump = jumpRef.current;
      if (activePhase === "dashing" && activeJump) {
        const progress = Math.min(1, (time - activeJump.startedAt) / activeJump.duration);
        const eased = 1 - Math.pow(1 - progress, 2.4);
        const arc = Math.sin(progress * Math.PI) * activeJump.peak;
        const nextPlayer = {
          x: activeJump.startX + (activeJump.landX - activeJump.startX) * eased,
          y: activeJump.startY + (activeJump.landY - activeJump.startY) * eased - arc,
          pose: progress < 0.82 ? "midair" as const : activeJump.fail ? "fall" as const : "landing" as const,
        };
        playerRef.current = nextPlayer;
        setPlayer(nextPlayer);

        const egg = eggPosition(currentRef.current, targetRef.current);
        if (!activeJump.fail && !targetRef.current.eggCollected && distance(playerCenter(nextPlayer), egg) < 76) {
          const eggScore = targetRef.current.eggType === "crystal" ? CRYSTAL_EGG_SCORE : GOLD_EGG_SCORE;
          const nextScore = scorePickup(comboRef.current + 1, targetRef.current.eggType, cap, scoreRef.current);
          targetRef.current = { ...targetRef.current, eggCollected: true };
          scoreRef.current = nextScore;
          eggsRef.current += 1;
          setTargetPlatform(targetRef.current);
          setScore(nextScore);
          setEggsCollected(eggsRef.current);
          setPickupFx((items) => [...items.slice(-3), { id: time, x: egg.x, y: egg.y, label: `+${eggScore}` }]);
        }

        if (progress >= 1) {
          setJump(null);
          jumpRef.current = null;

          if (activeJump.fail) {
            setPhase("failed");
            window.setTimeout(() => failRun(), 260);
          } else {
            const wasCracked = targetRef.current.type === "cracked";
            const landed = { ...targetRef.current, type: "normal" as const, drift: 0, baseX: targetRef.current.x, baseY: targetRef.current.y };
            const nextCombo = comboRef.current + 1;
            const nextScore = scoreLanding(nextCombo, "none", cap, scoreRef.current);
            const nextRound = roundRef.current + 1;
            const nextTarget = createNextTargetNode(nextRound, landed);
            comboRef.current = nextCombo;
            scoreRef.current = nextScore;
            currentRef.current = landed;
            targetRef.current = nextTarget;
            setPhase("landed");
            setCombo(nextCombo);
            setScore(nextScore);
            setCurrentPlatform(landed);
            setTargetPlatform(nextTarget);
            setPlayer(platformPlayerPosition(landed));
            setRound(nextRound);

            if (wasCracked) {
              window.setTimeout(() => failRun(), 420);
            } else {
              window.setTimeout(() => {
                if (phaseRef.current !== "gameover") setPhase("aiming");
              }, Math.max(110, 280 - nextRound * 4));
            }
          }
        }
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [cap, failRun]);

  useEffect(() => {
    if (pickupFx.length === 0) return;
    const timer = window.setTimeout(() => setPickupFx((items) => items.slice(1)), 680);
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
    aimAngle,
    timingWindow: getTimingWindow(round),
    arena: ARENA_SIZE,
    result,
    pickupFx,
    localBest,
    maxScorePerRun: cap,
    aimRadius: AIM_RADIUS,
    startRun,
    attemptJump: startDash,
    resetToMenu,
  };
}

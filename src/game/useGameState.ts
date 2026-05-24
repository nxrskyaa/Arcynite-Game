import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MAX_SCORE_PER_RUN, LOCAL_BEST_KEY } from "./constants";
import { platformForRound, meterSpeedForRound, timingWindowForRound } from "./level";
import { scoreLanding } from "./scoring";
import type { GamePhase, Platform, RunResult } from "./types";

type PlayerPose = "idle" | "jump_start" | "midair" | "landing" | "fall" | "celebrate";

export function useGameState(maxScorePerRun?: bigint) {
  const cap = Number(maxScorePerRun ?? BigInt(DEFAULT_MAX_SCORE_PER_RUN));
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [eggsCollected, setEggsCollected] = useState(0);
  const [combo, setCombo] = useState(0);
  const [meter, setMeter] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pose, setPose] = useState<PlayerPose>("idle");
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [localBest, setLocalBest] = useState(() => Number(localStorage.getItem(LOCAL_BEST_KEY) ?? 0));
  const actionLock = useRef(false);

  const currentPlatform = useMemo<Platform>(() => ({ id: 0, x: 18, y: 62, risky: false, egg: "none" }), []);
  const targetPlatform = useMemo(() => platformForRound(round), [round]);
  const timingWindow = timingWindowForRound(round);
  const meterSpeed = meterSpeedForRound(round);

  useEffect(() => {
    if (phase !== "playing") return;

    const timer = window.setInterval(() => {
      setMeter((current) => {
        let next = current + direction * meterSpeed;
        if (next >= 100) {
          next = 100;
          setDirection(-1);
        }
        if (next <= 0) {
          next = 0;
          setDirection(1);
        }
        return next;
      });
    }, 16);

    return () => window.clearInterval(timer);
  }, [direction, meterSpeed, phase]);

  const finishRun = useCallback((finalScore: number, finalEggs: number, finalCombo: number) => {
    const durationSeconds = Math.max(1, Math.floor((Date.now() - (runStartedAt ?? Date.now())) / 1000));
    const finalResult = {
      score: finalScore,
      eggsCollected: finalEggs,
      durationSeconds,
      combo: finalCombo,
    };
    setResult(finalResult);
    setPose("fall");
    setPhase("gameover");
    if (finalScore > localBest) {
      localStorage.setItem(LOCAL_BEST_KEY, String(finalScore));
      setLocalBest(finalScore);
    }
  }, [localBest, runStartedAt]);

  const startRun = useCallback(() => {
    setPhase("playing");
    setRound(1);
    setScore(0);
    setEggsCollected(0);
    setCombo(0);
    setMeter(0);
    setDirection(1);
    setPose("idle");
    setRunStartedAt(Date.now());
    setResult(null);
    actionLock.current = false;
  }, []);

  const resetToMenu = useCallback(() => {
    setPhase("menu");
    setPose("idle");
    setResult(null);
    actionLock.current = false;
  }, []);

  const attemptJump = useCallback(() => {
    if (phase !== "playing" || actionLock.current) return;
    actionLock.current = true;
    setPose("jump_start");

    const hit = Math.abs(meter - 50) <= timingWindow / 2;
    window.setTimeout(() => setPose(hit ? "midair" : "fall"), 90);

    if (!hit) {
      window.setTimeout(() => finishRun(score, eggsCollected, combo), 360);
      return;
    }

    const nextCombo = combo + 1;
    const collected = targetPlatform.egg !== "none" ? 1 : 0;
    const nextEggs = eggsCollected + collected;
    const nextScore = scoreLanding(nextCombo, targetPlatform.egg, cap, score);

    setPhase("jumping");
    window.setTimeout(() => {
      setScore(nextScore);
      setCombo(nextCombo);
      setEggsCollected(nextEggs);
      setRound((current) => current + 1);
      setMeter(0);
      setDirection(1);
      setPose("landing");
    }, 280);

    window.setTimeout(() => {
      actionLock.current = false;
      setPose("idle");
      setPhase("playing");
    }, 520);
  }, [cap, combo, eggsCollected, finishRun, meter, phase, score, targetPlatform.egg, timingWindow]);

  return {
    phase,
    round,
    score,
    eggsCollected,
    combo,
    meter,
    timingWindow,
    pose,
    currentPlatform,
    targetPlatform,
    result,
    localBest,
    maxScorePerRun: cap,
    startRun,
    attemptJump,
    resetToMenu,
  };
}

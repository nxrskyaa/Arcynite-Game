import type { EggKind, Platform } from "./types";

export function timingWindowForRound(round: number) {
  return Math.max(12, 34 - round * 1.3);
}

export function meterSpeedForRound(round: number) {
  return 0.75 + round * 0.045;
}

export function platformForRound(round: number): Platform {
  const eggRoll = Math.random();
  const egg: EggKind = eggRoll > 0.87 ? "crystal" : eggRoll > 0.42 ? "gold" : "none";

  return {
    id: round,
    x: 54 + Math.min(round * 1.8, 12),
    y: 58 - (round % 4) * 5,
    risky: round > 6 && round % 5 === 0,
    egg,
  };
}

import { BASE_LANDING_SCORE, CRYSTAL_EGG_SCORE, GOLD_EGG_SCORE } from "./constants";
import type { EggKind } from "./types";

export function comboMultiplier(combo: number) {
  return Math.min(1 + Math.floor(combo / 4) * 0.25, 3);
}

export function scoreLanding(combo: number, egg: EggKind, maxScore: number, currentScore: number) {
  const eggScore = egg === "crystal" ? CRYSTAL_EGG_SCORE : egg === "gold" ? GOLD_EGG_SCORE : 0;
  const gained = Math.round((BASE_LANDING_SCORE + eggScore) * comboMultiplier(combo));
  return Math.min(maxScore, currentScore + gained);
}

export function scorePickup(combo: number, egg: EggKind, maxScore: number, currentScore: number) {
  const base = egg === "crystal" ? CRYSTAL_EGG_SCORE : egg === "gold" ? GOLD_EGG_SCORE : 0;
  return Math.min(maxScore, currentScore + Math.round(base * comboMultiplier(Math.max(combo, 1))));
}

import type { EggKind, Platform } from "./types";

export const PLATFORM_WIDTH = 260;
export const PLATFORM_HEIGHT = 92;
export const PLAYER_WIDTH = 132;
export const PLAYER_HEIGHT = 132;

export function firstPlatform(): Platform {
  return {
    id: 0,
    x: 260,
    y: 430,
    baseX: 260,
    baseY: 430,
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
    type: "normal",
    eggType: "none",
    eggCollected: true,
    drift: 0,
  };
}

export function platformForRound(round: number, previous: Platform): Platform {
  const eggRoll = Math.random();
  const eggType: EggKind = eggRoll > 0.88 ? "crystal" : eggRoll > 0.22 ? "gold" : "none";
  const distance = 360 + Math.min(round * 24, 250) + Math.random() * Math.min(70 + round * 8, 150);
  const yShift = (Math.random() - 0.5) * Math.min(90 + round * 3, 150);
  const baseY = Math.min(480, Math.max(345, previous.baseY + yShift));
  const cracked = round > 5 && round % 5 === 0;

  return {
    id: round,
    x: previous.baseX + distance,
    y: baseY,
    baseX: previous.baseX + distance,
    baseY,
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
    type: cracked ? "cracked" : "target",
    eggType,
    eggCollected: eggType === "none",
    drift: Math.min(round * 5, 44),
  };
}

export function moveTargetPlatform(platform: Platform, elapsedMs: number): Platform {
  if (platform.type === "normal") return platform;

  const phase = elapsedMs / 820 + platform.id;
  return {
    ...platform,
    x: platform.baseX + Math.sin(phase) * platform.drift,
    y: platform.baseY + Math.cos(phase * 0.8) * platform.drift * 0.45,
  };
}

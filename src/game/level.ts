import type { ArenaSize, EggKind, Platform } from "./types";

export const ARENA_SIZE: ArenaSize = { width: 960, height: 560 };
export const PLATFORM_WIDTH = 164;
export const PLATFORM_HEIGHT = 70;
export const PLAYER_WIDTH = 104;
export const PLAYER_HEIGHT = 104;
export const AIM_RADIUS = 86;

const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: 0.78, y: -0.62 },
  { x: 0.78, y: 0.62 },
  { x: -0.78, y: -0.62 },
  { x: -0.78, y: 0.62 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

export function firstPlatform(): Platform {
  const x = ARENA_SIZE.width * 0.5 - PLATFORM_WIDTH * 0.5;
  const y = ARENA_SIZE.height * 0.64;

  return {
    id: 0,
    x,
    y,
    baseX: x,
    baseY: y,
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
    type: "normal",
    eggType: "none",
    eggCollected: true,
    drift: 0,
  };
}

export function createNextTargetNode(round: number, previous: Platform): Platform {
  const eggRoll = Math.random();
  const eggType: EggKind = eggRoll > 0.88 ? "crystal" : eggRoll > 0.22 ? "gold" : "none";
  const distance = 190 + Math.min(round * 7, 54);
  const currentCenter = {
    x: previous.x + previous.width * 0.5,
    y: previous.y + previous.height * 0.45,
  };
  const viable = DIRECTIONS
    .map((dir) => ({
      x: currentCenter.x + dir.x * distance,
      y: currentCenter.y + dir.y * distance * 0.72,
    }))
    .filter((center) => center.x > 150 && center.x < ARENA_SIZE.width - 150 && center.y > 120 && center.y < ARENA_SIZE.height - 105);
  const chosen = viable[Math.floor(Math.random() * viable.length)] ?? {
    x: ARENA_SIZE.width * 0.5 + 210,
    y: ARENA_SIZE.height * 0.48,
  };
  const baseX = chosen.x - PLATFORM_WIDTH * 0.5;
  const baseY = chosen.y - PLATFORM_HEIGHT * 0.45;
  const cracked = round > 5 && round % 5 === 0;

  return {
    id: round,
    x: baseX,
    y: baseY,
    baseX,
    baseY,
    width: PLATFORM_WIDTH,
    height: PLATFORM_HEIGHT,
    type: cracked ? "cracked" : "target",
    eggType,
    eggCollected: eggType === "none",
    drift: Math.min(round * 1.5, 10),
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

export function getAimAngle(elapsedMs: number, round: number) {
  const speed = 0.0016 + Math.min(round * 0.00009, 0.0011);
  return (elapsedMs * speed) % (Math.PI * 2);
}

export function getTimingWindow(round: number) {
  return (Math.max(14, 35 - round * 1.15) * Math.PI) / 180;
}

export function getTargetAngle(player: { x: number; y: number }, target: Platform) {
  const targetCenter = {
    x: target.x + target.width * 0.5,
    y: target.y + target.height * 0.45,
  };
  return Math.atan2(targetCenter.y - player.y, targetCenter.x - player.x);
}

export function getAngleDifference(a: number, b: number) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

export function isTimingSuccess(aimAngle: number, targetAngle: number, timingWindow: number) {
  return getAngleDifference(aimAngle, targetAngle) <= timingWindow;
}

export function platformForRound(round: number, previous: Platform) {
  return createNextTargetNode(round, previous);
}

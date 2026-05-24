export type GamePhase = "ready" | "aiming" | "dashing" | "landed" | "failed" | "gameover";

export type EggKind = "gold" | "crystal" | "none";
export type PlatformType = "normal" | "target" | "cracked";

export type Platform = {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  width: number;
  height: number;
  type: PlatformType;
  eggType: EggKind;
  eggCollected: boolean;
  drift: number;
};

export type ArenaSize = {
  width: number;
  height: number;
};

export type PlayerPose = "idle" | "jump_start" | "midair" | "landing" | "fall" | "celebrate";

export type PlayerState = {
  x: number;
  y: number;
  pose: PlayerPose;
};

export type PickupFx = {
  id: number;
  x: number;
  y: number;
  label: string;
};

export type JumpState = {
  startX: number;
  startY: number;
  landX: number;
  landY: number;
  startedAt: number;
  duration: number;
  peak: number;
  fail: boolean;
};

export type RunResult = {
  score: number;
  eggsCollected: number;
  durationSeconds: number;
  combo: number;
  localBest: number;
};

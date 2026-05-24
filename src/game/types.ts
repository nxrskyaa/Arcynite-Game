export type GamePhase = "menu" | "playing" | "jumping" | "gameover";

export type EggKind = "gold" | "crystal" | "none";

export type Platform = {
  id: number;
  x: number;
  y: number;
  risky: boolean;
  egg: EggKind;
};

export type RunResult = {
  score: number;
  eggsCollected: number;
  durationSeconds: number;
  combo: number;
};

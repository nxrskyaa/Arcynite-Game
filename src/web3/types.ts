import type { Address } from "viem";

export type ArcyniteProfile = {
  exists: boolean;
  nickname: string;
  xHandle: string;
  createdAt: bigint;
  gamesPlayed: number;
  totalScore: bigint;
  bestScore: bigint;
  totalEggs: bigint;
  lastSubmitAt: bigint;
};

export type LeaderboardEntry = {
  rank: number;
  address: Address;
  score: bigint;
  profile?: ArcyniteProfile;
};

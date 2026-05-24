import { createPublicClient, http, keccak256, toBytes, type Address, type Hex } from "viem";
import { ARC_TESTNET } from "../config/arc";
import { ARCYNITE_CONTRACT_ADDRESS, ARCYNITE_GAME_ABI } from "../config/contract";
import { createArcWalletClient } from "./wallet";
import type { ArcyniteProfile, LeaderboardEntry } from "./types";

export const publicClient = createPublicClient({
  chain: ARC_TESTNET,
  transport: http(),
});

export async function getGameSettings() {
  const [maxScorePerRun, minRunSeconds, submitCooldown] = await Promise.all([
    publicClient.readContract({
      address: ARCYNITE_CONTRACT_ADDRESS,
      abi: ARCYNITE_GAME_ABI,
      functionName: "maxScorePerRun",
    }),
    publicClient.readContract({
      address: ARCYNITE_CONTRACT_ADDRESS,
      abi: ARCYNITE_GAME_ABI,
      functionName: "minRunSeconds",
    }),
    publicClient.readContract({
      address: ARCYNITE_CONTRACT_ADDRESS,
      abi: ARCYNITE_GAME_ABI,
      functionName: "submitCooldown",
    }),
  ]);

  return { maxScorePerRun, minRunSeconds, submitCooldown };
}

export async function profileExists(address: Address) {
  return publicClient.readContract({
    address: ARCYNITE_CONTRACT_ADDRESS,
    abi: ARCYNITE_GAME_ABI,
    functionName: "profileExists",
    args: [address],
  });
}

export async function getProfile(address: Address): Promise<ArcyniteProfile> {
  const result = await publicClient.readContract({
    address: ARCYNITE_CONTRACT_ADDRESS,
    abi: ARCYNITE_GAME_ABI,
    functionName: "getProfile",
    args: [address],
  });
  const [exists, nickname, xHandle, createdAt, gamesPlayed, totalScore, bestScore, totalEggs, lastSubmitAt] = result;

  return {
    exists,
    nickname,
    xHandle,
    createdAt,
    gamesPlayed,
    totalScore,
    bestScore,
    totalEggs,
    lastSubmitAt,
  };
}

export async function createProfile(nickname: string, xHandle: string, account: Address) {
  const walletClient = createArcWalletClient();
  const hash = await walletClient.writeContract({
    account,
    address: ARCYNITE_CONTRACT_ADDRESS,
    abi: ARCYNITE_GAME_ABI,
    functionName: "createProfile",
    args: [nickname, xHandle],
    chain: ARC_TESTNET,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}

export async function submitScore(score: number, eggsCollected: number, durationSeconds: number, runId: Hex, account: Address) {
  const walletClient = createArcWalletClient();
  const hash = await walletClient.writeContract({
    account,
    address: ARCYNITE_CONTRACT_ADDRESS,
    abi: ARCYNITE_GAME_ABI,
    functionName: "submitScore",
    args: [BigInt(score), BigInt(eggsCollected), BigInt(durationSeconds), runId],
    chain: ARC_TESTNET,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const [players, scores] = await publicClient.readContract({
    address: ARCYNITE_CONTRACT_ADDRESS,
    abi: ARCYNITE_GAME_ABI,
    functionName: "getTopScores",
  });

  const entries = players
    .map((address, index) => ({
      rank: index + 1,
      address,
      score: scores[index],
    }))
    .filter((entry) => entry.address !== "0x0000000000000000000000000000000000000000" && entry.score > 0n);

  return Promise.all(
    entries.map(async (entry) => {
      try {
        return { ...entry, profile: await getProfile(entry.address) };
      } catch {
        return entry;
      }
    }),
  );
}

export function createRunId(account: Address) {
  const random = crypto.getRandomValues(new Uint32Array(4)).join("-");
  return keccak256(toBytes(`${account}-${Date.now()}-${random}`));
}

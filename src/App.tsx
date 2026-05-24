import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import ConnectWallet from "./components/ConnectWallet";
import GameScreen from "./components/GameScreen";
import LoadingScreen from "./components/LoadingScreen";
import MainMenu from "./components/MainMenu";
import NetworkGate from "./components/NetworkGate";
import ProfileGate from "./components/ProfileGate";
import { ARC_TESTNET_CHAIN_ID } from "./config/arc";
import type { RunResult } from "./game/types";
import { DEFAULT_MAX_SCORE_PER_RUN, LOCAL_BEST_KEY } from "./game/constants";
import { createProfile, createRunId, getGameSettings, getLeaderboard, getProfile, profileExists, submitScore } from "./web3/arcynite";
import type { ArcyniteProfile, LeaderboardEntry } from "./web3/types";
import { connectWallet, getConnectedAccounts, getCurrentChainId, hasWallet, switchToArcTestnet } from "./web3/wallet";

type ScreenState = "loading" | "wallet" | "wrongNetwork" | "profile" | "menu" | "playing" | "submittingScore" | "submitted";

function userMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export default function App() {
  const [screen, setScreen] = useState<ScreenState>("loading");
  const [account, setAccount] = useState<Address | null>(null);
  const [profile, setProfile] = useState<ArcyniteProfile | null>(null);
  const [maxScorePerRun, setMaxScorePerRun] = useState<bigint>(BigInt(DEFAULT_MAX_SCORE_PER_RUN));
  const [walletError, setWalletError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [profilePending, setProfilePending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [localBest, setLocalBest] = useState(() => Number(localStorage.getItem(LOCAL_BEST_KEY) ?? 0));

  const refreshLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      setLeaderboard(await getLeaderboard());
    } catch (error) {
      setLeaderboardError(userMessage(error));
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  const loadProfileGate = useCallback(async (address: Address) => {
    setWalletError("");
    setProfileError("");
    setAccount(address);

    const chainId = await getCurrentChainId();
    if (chainId !== ARC_TESTNET_CHAIN_ID) {
      setScreen("wrongNetwork");
      return;
    }

    try {
      const [settings, exists] = await Promise.all([getGameSettings(), profileExists(address)]);
      setMaxScorePerRun(settings.maxScorePerRun);

      if (!exists) {
        setProfile(null);
        setScreen("profile");
        return;
      }

      setProfile(await getProfile(address));
      setScreen("menu");
      void refreshLeaderboard();
    } catch (error) {
      setProfileError(userMessage(error));
      setScreen("profile");
    }
  }, [refreshLeaderboard]);

  useEffect(() => {
    async function boot() {
      if (!hasWallet()) {
        setScreen("wallet");
        return;
      }

      try {
        const [address] = await getConnectedAccounts();
        if (!address) {
          setScreen("wallet");
          return;
        }
        await loadProfileGate(address);
      } catch (error) {
        setWalletError(userMessage(error));
        setScreen("wallet");
      }
    }

    void boot();
  }, [loadProfileGate]);

  useEffect(() => {
    const provider = window.ethereum;
    if (!provider) return;

    const onAccountsChanged = (accounts: unknown) => {
      const [nextAccount] = accounts as Address[];
      if (!nextAccount) {
        setAccount(null);
        setProfile(null);
        setScreen("wallet");
        return;
      }
      void loadProfileGate(nextAccount);
    };
    const onChainChanged = () => {
      if (account) void loadProfileGate(account);
    };

    provider.on?.("accountsChanged", onAccountsChanged);
    provider.on?.("chainChanged", onChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [account, loadProfileGate]);

  const handleConnect = async () => {
    setWalletError("");
    try {
      const address = await connectWallet();
      await loadProfileGate(address);
    } catch (error) {
      setWalletError(userMessage(error));
    }
  };

  const handleSwitchNetwork = async () => {
    setWalletError("");
    try {
      await switchToArcTestnet();
      if (account) await loadProfileGate(account);
      else setScreen("wallet");
    } catch (error) {
      setWalletError(userMessage(error));
    }
  };

  const handleCreateProfile = async (nickname: string, xHandle: string) => {
    if (!account) return;
    setProfilePending(true);
    setProfileError("");
    try {
      await createProfile(nickname, xHandle, account);
      setProfile(await getProfile(account));
      setScreen("menu");
      void refreshLeaderboard();
    } catch (error) {
      setProfileError(userMessage(error));
    } finally {
      setProfilePending(false);
    }
  };

  const handleSubmitScore = async (result: RunResult) => {
    if (!account) return;
    setSubmitting(true);
    setSubmitError("");
    setScreen("submittingScore");
    try {
      await submitScore(result.score, result.eggsCollected, result.durationSeconds, createRunId(account), account);
      setProfile(await getProfile(account));
      await refreshLeaderboard();
      setSubmitted(true);
      setScreen("submitted");
    } catch (error) {
      setSubmitError(userMessage(error));
      setScreen("playing");
    } finally {
      setSubmitting(false);
    }
  };

  if (screen === "loading") return <LoadingScreen />;
  if (screen === "wallet") return <ConnectWallet hasWallet={hasWallet()} error={walletError} onConnect={handleConnect} />;

  return (
    <NetworkGate isCorrectNetwork={screen !== "wrongNetwork"} error={walletError} onSwitchNetwork={handleSwitchNetwork}>
      {account && (
        <ProfileGate
          account={account}
          profile={profile}
          pending={profilePending}
          error={profileError}
          onCreateProfile={handleCreateProfile}
        >
          {profile && screen !== "playing" && screen !== "submittingScore" && screen !== "submitted" && (
            <MainMenu
              account={account}
              profile={profile}
              localBest={localBest}
              leaderboard={leaderboard}
              leaderboardLoading={leaderboardLoading}
              leaderboardError={leaderboardError}
              onStartGame={() => {
                setSubmitted(false);
                setSubmitError("");
                setScreen("playing");
              }}
              onRefreshLeaderboard={refreshLeaderboard}
            />
          )}
          {profile && (screen === "playing" || screen === "submittingScore" || screen === "submitted") && (
            <GameScreen
              maxScorePerRun={maxScorePerRun}
              submitted={submitted}
              submitting={submitting}
              submitError={submitError}
              onSubmitScore={handleSubmitScore}
              onExitToMenu={() => {
                setLocalBest(Number(localStorage.getItem(LOCAL_BEST_KEY) ?? 0));
                setSubmitted(false);
                setScreen("menu");
              }}
            />
          )}
        </ProfileGate>
      )}
    </NetworkGate>
  );
}

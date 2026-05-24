import type { Address } from "viem";
import type { ArcyniteProfile, LeaderboardEntry } from "../web3/types";
import { shortAddress } from "../web3/wallet";
import AssetImage, { assetPath } from "./AssetImage";
import { xAvatarUrl } from "./CreateProfileScreen";
import LeaderboardPanel from "./LeaderboardPanel";

type MainMenuProps = {
  account: Address;
  profile: ArcyniteProfile;
  localBest: number;
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError?: string;
  onStartGame: () => void;
  onRefreshLeaderboard: () => void;
};

export default function MainMenu({ account, profile, localBest, leaderboard, leaderboardLoading, leaderboardError, onStartGame, onRefreshLeaderboard }: MainMenuProps) {
  const avatar = profile.xHandle ? xAvatarUrl(profile.xHandle) : assetPath("player_portrait_icon.png");

  return (
    <section className="screen menu-screen">
      <div className="menu-main pixel-panel">
        <div className="menu-hero-row">
          <div>
            <span className="eyebrow">Profile Unlocked</span>
            <h1>Arcynite</h1>
            <p>Hop platform to platform, grab eggs in the air, protect the combo, and submit your best run on Arc Testnet.</p>
          </div>
          <div className="avatar-shell small">
            <AssetImage filename="ui_avatar_frame.png" alt="" className="avatar-frame" />
            <img
              src={avatar}
              alt="Player avatar"
              className="avatar-image"
              onError={(event) => {
                event.currentTarget.src = assetPath("player_portrait_icon.png");
              }}
            />
          </div>
        </div>
        <div className="profile-stat-grid">
          <div>
            <span>Runner</span>
            <strong>{profile.nickname}</strong>
          </div>
          <div>
            <span>Wallet</span>
            <strong>{shortAddress(account)}</strong>
          </div>
          <div>
            <span>Onchain Best</span>
            <strong>{profile.bestScore.toLocaleString()}</strong>
          </div>
          <div>
            <span>Local Best</span>
            <strong>{localBest.toLocaleString()}</strong>
          </div>
          <div>
            <span>Games</span>
            <strong>{profile.gamesPlayed}</strong>
          </div>
          <div>
            <span>Total Eggs</span>
            <strong>{profile.totalEggs.toLocaleString()}</strong>
          </div>
        </div>
        <div className="menu-actions">
          <button className="primary-button" type="button" onClick={onStartGame}>Start Dash Run</button>
        </div>
        <div className="menu-assets" aria-hidden="true">
          <AssetImage filename="platform_target.png" alt="" />
          <AssetImage filename="egg_gold.png" alt="" />
          <AssetImage filename="egg_crystal_rare.png" alt="" />
          <AssetImage filename="hazard_spikes.png" alt="" />
        </div>
      </div>
      <LeaderboardPanel
        entries={leaderboard}
        loading={leaderboardLoading}
        error={leaderboardError}
        onRefresh={onRefreshLeaderboard}
      />
    </section>
  );
}

import type { LeaderboardEntry } from "../web3/types";
import { shortAddress } from "../web3/wallet";
import AssetImage, { assetPath } from "./AssetImage";
import { xAvatarUrl } from "./CreateProfileScreen";

type LeaderboardPanelProps = {
  entries: LeaderboardEntry[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
};

export default function LeaderboardPanel({ entries, loading, error, onRefresh }: LeaderboardPanelProps) {
  return (
    <aside className="pixel-panel leaderboard-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Arc Testnet</span>
          <h2>Leaderboard</h2>
        </div>
        <button className="icon-button" type="button" onClick={onRefresh} aria-label="Refresh leaderboard">↻</button>
      </div>
      {loading && <p>Loading top scores...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && entries.length === 0 && <p className="muted">No submitted scores yet.</p>}
      <div className="leaderboard-list">
        {entries.map((entry) => {
          const profile = entry.profile;
          const handle = profile?.xHandle ?? "";
          return (
            <div className="leaderboard-row" key={entry.address}>
              <span className="rank">#{entry.rank}</span>
              <img
                className="leader-avatar"
                src={handle ? xAvatarUrl(handle) : assetPath("player_portrait_icon.png")}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = assetPath("player_portrait_icon.png");
                }}
              />
              <div className="leader-info">
                <strong>{profile?.nickname || "Arc Runner"}</strong>
                <span>{handle ? `@${handle}` : shortAddress(entry.address)}</span>
              </div>
              <strong className="leader-score">{entry.score.toLocaleString()}</strong>
            </div>
          );
        })}
      </div>
      <AssetImage filename="object_treasure_chest.png" alt="" className="leaderboard-chest" />
    </aside>
  );
}

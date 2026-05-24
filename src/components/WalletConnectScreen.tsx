import AssetImage from "./AssetImage";

type WalletConnectScreenProps = {
  hasWallet: boolean;
  error?: string;
  onConnect: () => void;
};

export default function WalletConnectScreen({ hasWallet, error, onConnect }: WalletConnectScreenProps) {
  return (
    <section className="screen split-screen">
      <div className="hero-art">
        <AssetImage filename="object_arcane_portal.png" alt="" className="hero-portal" />
        <AssetImage filename="player_idle.png" alt="Arcynite koala mascot" className="hero-mascot" />
        <AssetImage filename="egg_crystal_rare.png" alt="" className="hero-egg crystal" />
        <AssetImage filename="egg_gold.png" alt="" className="hero-egg gold" />
      </div>
      <div className="pixel-panel hero-copy">
        <span className="eyebrow">Arc Testnet Egg Dash</span>
        <h1>Arcynite</h1>
        <p>Connect your wallet, mint your onchain runner profile, then time each dash for eggs, combos, and leaderboard glory.</p>
        <button className="primary-button" type="button" onClick={onConnect} disabled={!hasWallet}>
          {hasWallet ? "Connect Wallet" : "Wallet Not Installed"}
        </button>
        {!hasWallet && <p className="error-text">Install an EVM wallet like MetaMask or Rabby to play.</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  );
}

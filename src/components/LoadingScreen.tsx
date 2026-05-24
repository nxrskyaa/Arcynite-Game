import AssetImage from "./AssetImage";

export default function LoadingScreen() {
  return (
    <section className="screen center-screen">
      <div className="logo-stack">
        <AssetImage filename="object_arcane_portal.png" alt="" className="portal-orbit" />
        <AssetImage filename="player_idle.png" alt="Arcynite mascot" className="loading-mascot" />
      </div>
      <h1>Arcynite</h1>
      <p>Syncing profile gate with Arc Testnet...</p>
      <div className="pixel-loader" />
    </section>
  );
}

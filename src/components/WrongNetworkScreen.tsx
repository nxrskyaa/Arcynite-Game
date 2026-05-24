import { ARC_TESTNET_CHAIN_ID_HEX } from "../config/arc";
import AssetImage from "./AssetImage";

type WrongNetworkScreenProps = {
  error?: string;
  onSwitchNetwork: () => void;
};

export default function WrongNetworkScreen({ error, onSwitchNetwork }: WrongNetworkScreenProps) {
  return (
    <section className="screen center-screen">
      <div className="pixel-panel narrow-panel">
        <AssetImage filename="fx_target_pulse_ring.png" alt="" className="panel-icon" />
        <h1>Switch to Arc Testnet</h1>
        <p>Arcynite is wired to Chain ID {ARC_TESTNET_CHAIN_ID_HEX}. Your wallet needs to switch before profile checks and score submits unlock.</p>
        <button className="primary-button" type="button" onClick={onSwitchNetwork}>
          Switch to Arc Testnet
        </button>
        {error && <p className="error-text">{error}</p>}
      </div>
    </section>
  );
}

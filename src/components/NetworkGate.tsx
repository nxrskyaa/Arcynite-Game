import type { ReactNode } from "react";
import WrongNetworkScreen from "./WrongNetworkScreen";

type NetworkGateProps = {
  isCorrectNetwork: boolean;
  error?: string;
  onSwitchNetwork: () => void;
  children: ReactNode;
};

export default function NetworkGate({ isCorrectNetwork, error, onSwitchNetwork, children }: NetworkGateProps) {
  if (!isCorrectNetwork) {
    return <WrongNetworkScreen error={error} onSwitchNetwork={onSwitchNetwork} />;
  }

  return <>{children}</>;
}

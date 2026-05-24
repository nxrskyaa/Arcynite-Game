import WalletConnectScreen from "./WalletConnectScreen";

type ConnectWalletProps = {
  hasWallet: boolean;
  error?: string;
  onConnect: () => void;
};

export default function ConnectWallet(props: ConnectWalletProps) {
  return <WalletConnectScreen {...props} />;
}

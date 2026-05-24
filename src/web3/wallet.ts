import { createWalletClient, custom, type Address, type EIP1193Provider } from "viem";
import { ARC_TESTNET, ARC_TESTNET_CHAIN_ID, ARC_TESTNET_CHAIN_ID_HEX, ARC_TESTNET_EXPLORER_URL, ARC_TESTNET_RPC_URL } from "../config/arc";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export function getInjectedProvider() {
  return window.ethereum;
}

export function hasWallet() {
  return Boolean(getInjectedProvider());
}

export async function getConnectedAccounts(): Promise<Address[]> {
  const provider = getInjectedProvider();
  if (!provider) return [];
  const accounts = await provider.request({ method: "eth_accounts" });
  return accounts as Address[];
}

export async function connectWallet(): Promise<Address> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("No injected wallet found. Install MetaMask, Rabby, or another EVM wallet.");
  }

  const accounts = await provider.request({ method: "eth_requestAccounts" });
  const [account] = accounts as Address[];
  if (!account) throw new Error("Wallet did not return an account.");
  return account;
}

export async function getCurrentChainId(): Promise<number | null> {
  const provider = getInjectedProvider();
  if (!provider) return null;
  const chainId = await provider.request({ method: "eth_chainId" });
  return Number.parseInt(chainId as string, 16);
}

export function createArcWalletClient() {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("No injected wallet found.");
  }

  return createWalletClient({
    chain: ARC_TESTNET,
    transport: custom(provider),
  });
}

export async function switchToArcTestnet() {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("No injected wallet found.");
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET_CHAIN_ID_HEX }],
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code !== 4902) throw error;

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: ARC_TESTNET_CHAIN_ID_HEX,
          chainName: "Arc Testnet",
          rpcUrls: [ARC_TESTNET_RPC_URL],
          blockExplorerUrls: [ARC_TESTNET_EXPLORER_URL],
          nativeCurrency: {
            name: "USDC",
            symbol: "USDC",
            decimals: 18,
          },
        },
      ],
    });
  }

  const chainId = await getCurrentChainId();
  if (chainId !== ARC_TESTNET_CHAIN_ID) {
    throw new Error("Wallet is still not connected to Arc Testnet.");
  }
}

export function shortAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

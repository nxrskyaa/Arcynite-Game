import type { ReactNode } from "react";
import type { Address } from "viem";
import type { ArcyniteProfile } from "../web3/types";
import CreateProfileScreen from "./CreateProfileScreen";

type ProfileGateProps = {
  account: Address;
  profile: ArcyniteProfile | null;
  pending: boolean;
  error?: string;
  onCreateProfile: (nickname: string, xHandle: string) => void;
  children: ReactNode;
};

export default function ProfileGate({ account, profile, pending, error, onCreateProfile, children }: ProfileGateProps) {
  if (!profile?.exists) {
    return (
      <CreateProfileScreen
        account={account}
        pending={pending}
        error={error}
        onCreateProfile={onCreateProfile}
      />
    );
  }

  return <>{children}</>;
}

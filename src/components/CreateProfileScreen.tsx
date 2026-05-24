import { useMemo, useState } from "react";
import type { Address } from "viem";
import { shortAddress } from "../web3/wallet";
import AssetImage, { assetPath } from "./AssetImage";

type CreateProfileScreenProps = {
  account: Address;
  pending: boolean;
  error?: string;
  onCreateProfile: (nickname: string, xHandle: string) => void;
};

function cleanXHandle(value: string) {
  return value.replace(/^@/, "").trim();
}

export function xAvatarUrl(xHandle: string) {
  const handle = cleanXHandle(xHandle);
  return handle ? `https://unavatar.io/x/${encodeURIComponent(handle)}` : assetPath("player_portrait_icon.png");
}

export default function CreateProfileScreen({ account, pending, error, onCreateProfile }: CreateProfileScreenProps) {
  const [nickname, setNickname] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatar = useMemo(() => avatarFailed ? assetPath("player_portrait_icon.png") : xAvatarUrl(xHandle), [avatarFailed, xHandle]);
  const canSubmit = nickname.trim().length >= 2 && cleanXHandle(xHandle).length >= 1 && !pending;

  return (
    <section className="screen profile-screen">
      <div className="pixel-panel profile-panel">
        <div className="profile-preview">
          <div className="avatar-shell">
            <AssetImage filename="ui_avatar_frame.png" alt="" className="avatar-frame" />
            <img src={avatar} alt="Profile avatar preview" className="avatar-image" onError={() => setAvatarFailed(true)} />
          </div>
          <span>{shortAddress(account)}</span>
        </div>
        <form
          className="profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) onCreateProfile(nickname.trim(), cleanXHandle(xHandle));
          }}
        >
          <span className="eyebrow">Create Runner Profile</span>
          <h1>Claim your Arcynite name</h1>
          <label>
            Nickname
            <input value={nickname} maxLength={24} onChange={(event) => setNickname(event.target.value)} placeholder="KoalaDash" />
          </label>
          <label>
            X handle
            <input value={xHandle} maxLength={32} onChange={(event) => {
              setAvatarFailed(false);
              setXHandle(event.target.value);
            }} placeholder="@nxrskyaa" />
          </label>
          <button className="primary-button" type="submit" disabled={!canSubmit}>
            {pending ? "Creating Profile..." : "Create Arcynite Profile"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";

type AssetManifestItem = {
  id: string;
  filename: string;
  category: string;
  purpose: string;
};

export default function AssetPreview() {
  const [assets, setAssets] = useState<AssetManifestItem[]>([]);

  useEffect(() => {
    fetch("/assets/generated/manifest.json")
      .then((response) => response.json())
      .then(setAssets)
      .catch(() => setAssets([]));
  }, []);

  return (
    <div className="asset-preview-strip">
      {assets.slice(0, 8).map((asset) => (
        <img key={asset.id} src={`/assets/generated/${asset.filename}`} alt={asset.purpose} />
      ))}
    </div>
  );
}

import type { CSSProperties } from "react";

type AssetImageProps = {
  filename: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

export function assetPath(filename: string) {
  return `/assets/generated/${filename}`;
}

export default function AssetImage({ filename, alt, className, style }: AssetImageProps) {
  return (
    <img
      className={className}
      style={style}
      src={assetPath(filename)}
      alt={alt}
      draggable={false}
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}

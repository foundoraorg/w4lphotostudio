import { useEffect, useState } from "react";
import type { ImageCrop } from "../../lib/config";
import { cropStyle, loadSheet, placeholderSheetUrl } from "../../lib/portfolio";

export function PrintImage({
  crop,
  alt,
  className = "",
  sizes,
}: {
  crop: ImageCrop;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [url, setUrl] = useState<string>(placeholderSheetUrl());

  useEffect(() => {
    let alive = true;
    void loadSheet().then((source) => {
      if (!alive) return;
      if (source instanceof HTMLImageElement && source.src && source.naturalWidth > 0) {
        setUrl(source.src);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div
      role="img"
      aria-label={alt}
      data-sizes={sizes}
      className={`bg-cover ${className}`}
      style={cropStyle(crop, url)}
    />
  );
}

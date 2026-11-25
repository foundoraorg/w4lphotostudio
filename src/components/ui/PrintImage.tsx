import { useEffect, useState } from "react";
import type { ImageCrop, Session } from "../../lib/config";
import { focusStyle, sessionImage } from "../../lib/images";
import { responsiveSource } from "../../lib/responsive";
import { cropStyle, loadSheet, placeholderSheetUrl, sheetCell } from "../../lib/portfolio";

interface PrintImageProps {
  /** Session whose photograph, focal point and sheet cell are used. */
  session?: Session;
  /** Sheet cell used when no session (or no photograph) is available. */
  crop?: ImageCrop;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
}

/**
 * A session photograph, framed at its `image_focus`. Falls back to the 3 x 3
 * sheet cell (`image_crop`) when the session has no photo or the file fails.
 */
export function PrintImage({ session, crop, alt, className = "", sizes, eager = false }: PrintImageProps) {
  const [sheetUrl, setSheetUrl] = useState<string>(placeholderSheetUrl());
  const [photoFailed, setPhotoFailed] = useState(false);
  const image = session ? sessionImage(session) : null;
  const photo = image?.url && !photoFailed ? { url: image.url, alt: image.alt, focus: image.focus } : null;
  const fallbackCrop = image?.crop ?? crop ?? sheetCell(0);

  useEffect(() => {
    let alive = true;
    void loadSheet().then((source) => {
      if (alive && source instanceof HTMLImageElement && source.src && source.naturalWidth > 0) {
        setSheetUrl(source.src);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (photo) {
    const responsive = responsiveSource(photo.url, sizes ?? "50vw");
    return (
      <img
        src={photo.url}
        srcSet={responsive.srcSet}
        sizes={responsive.sizes}
        width={responsive.width}
        height={responsive.height}
        alt={alt || photo.alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setPhotoFailed(true)}
        className={`object-cover ${className}`}
        style={focusStyle(photo.focus)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt || image?.alt || "Session photograph"}
      className={`bg-cover ${className}`}
      style={cropStyle(fallbackCrop, sheetUrl)}
    />
  );
}

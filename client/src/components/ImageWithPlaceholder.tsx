import React, { useState, type ImgHTMLAttributes } from "react";
import "./imagePlaceholder.css";

type ImageWithPlaceholderProps = ImgHTMLAttributes<HTMLImageElement> & {
  containerClassName?: string;
  previewSrc?: string;
};

export function ImageWithPlaceholder({ containerClassName = "", className = "", alt = "", previewSrc, onLoad, onError, ...imageProps }: ImageWithPlaceholderProps) {
  const [loaded, setLoaded] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <span className={`image-placeholder ${loaded ? "is-loaded" : ""} ${previewLoaded ? "has-preview" : ""} ${failed ? "is-failed" : ""} ${containerClassName}`}>
      {!loaded && <span className="image-placeholder__surface" aria-hidden="true"><span className="image-placeholder__signal" /><span className="image-placeholder__label">{failed ? "Illustration unavailable" : previewLoaded ? "Sharpening illustration" : "Loading illustration"}</span></span>}
      {previewSrc && <img src={previewSrc} alt="" aria-hidden="true" className="image-placeholder__preview" onLoad={() => setPreviewLoaded(true)} />}
      <img
        {...imageProps}
        alt={alt}
        className={className}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setFailed(true);
          onError?.(event);
        }}
      />
    </span>
  );
}

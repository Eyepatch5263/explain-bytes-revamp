import React, { useState, type ImgHTMLAttributes } from "react";
import "./imagePlaceholder.css";

type ImageWithPlaceholderProps = ImgHTMLAttributes<HTMLImageElement> & {
  containerClassName?: string;
};

export function ImageWithPlaceholder({ containerClassName = "", className = "", alt = "", onLoad, onError, ...imageProps }: ImageWithPlaceholderProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <span className={`image-placeholder ${loaded ? "is-loaded" : ""} ${failed ? "is-failed" : ""} ${containerClassName}`}>
      {!loaded && <span className="image-placeholder__surface" aria-hidden="true"><span className="image-placeholder__signal" /><span className="image-placeholder__label">{failed ? "Illustration unavailable" : "Loading illustration"}</span></span>}
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

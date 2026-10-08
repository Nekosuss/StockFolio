import React from "react";

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 28 28">
        <path d="M3 21h5v-6h6V9h6V5h5" />
        <path d="M3 24h22" className="mark-baseline" />
      </svg>
    </span>
  );
}

export default BrandMark;

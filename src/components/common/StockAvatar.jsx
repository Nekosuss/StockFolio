import React from "react";

export function StockAvatar({ symbol }) {
  return (
    <span className={"stock-avatar av-" + symbol}>{symbol.slice(0, 1)}</span>
  );
}

export default StockAvatar;

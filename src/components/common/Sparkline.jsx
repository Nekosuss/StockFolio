import React from "react";

export function Sparkline({ symbol, change = 0 }) {
  const seedValue = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
  const vals = Array.from(
    { length: 9 },
    (_, i) =>
      30 +
      Math.sin(i * 0.9 + seedValue) * 6 +
      Math.cos(i * 0.43 + seedValue) * 4 +
      (change / 4) * i,
  );
  const min = Math.min(...vals),
    max = Math.max(...vals);
  const pts = vals
    .map((v, i) => `${i * 10},${23 - ((v - min) / (max - min || 1)) * 19}`)
    .join(" ");
  return (
    <svg
      className="sparkline-svg"
      viewBox="0 0 80 25"
      aria-label={`Illustrative ${symbol} price trend`}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={change >= 0 ? "#238B5D" : "#C94C4C"}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default Sparkline;

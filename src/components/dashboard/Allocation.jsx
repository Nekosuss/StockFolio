import React from "react";
import { money } from "../../utils/formatters.js";

export function Allocation({ d }) {
  const data = Object.entries(
    d.holdings.reduce(
      (a, h) => ((a[h.sector] = (a[h.sector] || 0) + h.qty * h.price), a),
      {},
    ),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const colors = ["#426B4F", "#748578", "#9CA49B", "#B8B8AA", "#D0CEC3"];
  const total = data.reduce((a, x) => a + x.value, 0);

  return (
    <div className="allocation-bars">
      {data.map((a, i) => {
        const pct = total ? (a.value / total) * 100 : 0;
        return (
          <div
            className="allocation-bar-row"
            key={a.name}
            style={{ "--allocation-color": colors[i % colors.length] }}
          >
            <div className="allocation-meta">
              <span>
                <i />
                {a.name}
              </span>
              <b>{pct.toFixed(1)}%</b>
            </div>
            <div className="allocation-track">
              <span style={{ width: `${pct}%` }} />
            </div>
            <small>{money(a.value, 2)} market value</small>
          </div>
        );
      })}
      {!data.length && (
        <div className="timeline-empty">
          Allocation appears when you add holdings.
        </div>
      )}
    </div>
  );
}

export default Allocation;

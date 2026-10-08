import React from "react";
import { money } from "../../utils/formatters.js";

export function ActivityTimeline({ tx }) {
  return (
    <div className="editorial-timeline">
      {tx.map((item, i) => (
        <div className="timeline-item" key={item.id}>
          <span className="timeline-node" />
          <time>
            {i === 0
              ? "TODAY"
              : new Date(item.time)
                  .toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })
                  .toUpperCase()}
            <small>
              {new Date(item.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </time>
          <div>
            <b>
              {item.type === "BUY" ? "Bought" : "Sold"} {item.qty} {item.symbol}
            </b>
            <small>{item.name}</small>
          </div>
          <strong>
            {item.type === "BUY" ? "−" : "+"}
            {money(item.total, 2)}
          </strong>
        </div>
      ))}
    </div>
  );
}

export default ActivityTimeline;

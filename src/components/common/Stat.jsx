import React from "react";
import { cx } from "../../utils/formatters.js";

export function Stat({ title, value, note, icon: Icon, accent, positive }) {
  return (
    <div className={cx("stat-card", accent && "stat-accent")}>
      <div className="stat-label">
        {title}
        <span className="stat-icon">
          <Icon size={16} />
        </span>
      </div>
      <b className="stat-value">{value}</b>
      <small className={positive ? "positive" : ""}>{note}</small>
    </div>
  );
}

export default Stat;

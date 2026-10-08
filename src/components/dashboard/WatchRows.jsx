import React from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { StockAvatar } from "../common/StockAvatar.jsx";
import { Sparkline } from "../common/Sparkline.jsx";
import { money } from "../../utils/formatters.js";

export function WatchRows({ items, onRemove, empty }) {
  if (!items.length)
    return (
      empty || <div className="timeline-empty">Your watchlist is empty.</div>
    );
  return (
    <div className="watch-rows">
      {items.map((h, i) => (
        <div className="watch-line" key={h.symbol}>
          <Link to={"/stocks/" + h.symbol} className="watch-line-main">
            <span className="watch-rank">0{i + 1}</span>
            <StockAvatar symbol={h.symbol} />
            <span className="watch-name">
              <b>{h.symbol}</b>
              <small>{h.name}</small>
            </span>
            <Sparkline symbol={h.symbol} change={h.change || 0} />
            <strong>{money(h.price, 2)}</strong>
            <span className={h.change >= 0 ? "positive" : "negative"}>
              {h.change >= 0 ? "+" : ""}
              {Number(h.change || 0).toFixed(2)}%
            </span>
          </Link>
          {onRemove && (
            <button
              className="watch-remove"
              onClick={() => onRemove(h.symbol)}
              aria-label={`Remove ${h.symbol} from watchlist`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default WatchRows;

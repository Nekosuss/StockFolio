import React, { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, X } from "lucide-react";
import { StockAvatar } from "./StockAvatar.jsx";
import { cx, money } from "../../utils/formatters.js";

export function TradeModal({
  stock,
  owned = 0,
  initialType = "BUY",
  onClose,
  onTrade,
}) {
  const [type, setType] = useState(initialType),
    [qty, setQty] = useState("1");
  const n = Math.max(1, Number(qty) || 1);
  useEffect(() => {
    function key(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="trade-modal">
        <div className="modal-head">
          <div>
            <div className="eyebrow">VIRTUAL ORDER</div>
            <h2>{type === "BUY" ? "Buy shares" : "Sell shares"}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="trade-stock">
          <StockAvatar symbol={stock.symbol} />
          <span>
            <b>{stock.name}</b>
            <small>
              {stock.symbol} · {money(stock.price, 2)} per share
            </small>
          </span>
        </div>
        <div className="trade-tabs">
          <button
            className={type === "BUY" ? "buy-selected" : ""}
            onClick={() => setType("BUY")}
          >
            Buy
          </button>
          <button
            className={type === "SELL" ? "sell-selected" : ""}
            onClick={() => setType("SELL")}
          >
            Sell
          </button>
        </div>
        <label className="quantity-label">
          Quantity{" "}
          <span>
            {type === "SELL" ? `You own ${owned} shares` : "Whole shares only"}
          </span>
          <input
            type="number"
            min="1"
            max={type === "SELL" ? owned : undefined}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </label>
        <div className="estimate-row">
          <span>Estimated {type === "BUY" ? "cost" : "proceeds"}</span>
          <b>{money(n * stock.price, 2)}</b>
        </div>
        <div className="virtual-note">
          <ShieldCheck size={15} /> This is a virtual trade. No real money is
          involved.
        </div>
        <button
          className={cx(
            "btn",
            "trade-confirm",
            type === "BUY" ? "btn-primary" : "btn-sell",
          )}
          onClick={() => onTrade(type, n)}
          disabled={type === "SELL" && !owned}
        >
          {type === "BUY" ? "Confirm buy" : "Confirm sell"}{" "}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default TradeModal;

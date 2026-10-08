import React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cx, money } from "../../utils/formatters.js";

export function TransactionsRows({ tx }) {
  return (
    <div className="transaction-list">
      {tx.map((t) => (
        <div className="transaction-row" key={t.id}>
          <span
            className={cx(
              "transaction-icon",
              t.type === "BUY" ? "buy-icon" : "sell-icon",
            )}
          >
            {t.type === "BUY" ? (
              <ArrowDownLeft size={15} />
            ) : (
              <ArrowUpRight size={15} />
            )}
          </span>
          <span className="transaction-company">
            <b>
              {t.type === "BUY" ? "Bought" : "Sold"} {t.symbol}
            </b>
            <small>
              {t.qty} shares · {new Date(t.time).toLocaleDateString()}
            </small>
          </span>
          <span className="transaction-amount">
            <b>
              {t.type === "BUY" ? "−" : "+"}
              {money(t.total)}
            </b>
            <small>{t.type === "BUY" ? "BUY" : "SELL"}</small>
          </span>
        </div>
      ))}
    </div>
  );
}

export default TransactionsRows;

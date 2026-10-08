import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageHeading } from "../components/layout/PageHeading.jsx";
import { Holdings } from "../components/dashboard/Holdings.jsx";
import { Allocation } from "../components/dashboard/Allocation.jsx";
import { money } from "../utils/formatters.js";

export function Portfolio({ d }) {
  const best = [...d.holdings].sort(
      (a, b) => b.price / b.avg - 1 - (a.price / a.avg - 1),
    )[0],
    worst = [...d.holdings].sort(
      (a, b) => a.price / a.avg - 1 - (b.price / b.avg - 1),
    )[0],
    ret = d.invested ? (d.profit / d.invested) * 100 : 0;

  return (
    <>
      <PageHeading
        eyebrow="THE LONG VIEW"
        title="Portfolio."
        description="A considered view of your positions and how they’re performing."
      />
      <div className="portfolio-ledger portfolio-page-ledger">
        <div className="ledger-cell">
          <small>MARKET VALUE</small>
          <b>{money(d.total, 2)}</b>
          <i>Across {d.holdings.length} positions</i>
        </div>
        <div className="ledger-cell">
          <small>INVESTED CAPITAL</small>
          <b>{money(d.invested, 2)}</b>
          <i>Weighted cost basis</i>
        </div>
        <div className="ledger-cell">
          <small>UNREALIZED P / L</small>
          <b className={d.profit >= 0 ? "positive" : "negative"}>
            {d.profit >= 0 ? "+" : "−"}
            {money(Math.abs(d.profit), 2)}
          </b>
          <i>
            {ret >= 0 ? "+" : ""}
            {ret.toFixed(2)}% return
          </i>
        </div>
        <div className="ledger-note">
          <span>AVAILABLE CASH</span>
          <b>{money(d.cash, 2)}</b>
          <i>Virtual balance</i>
        </div>
      </div>
      <div className="dashboard-columns dashboard-columns-wide portfolio-content">
        <section className="section-plain reveal">
          <div className="section-heading-line">
            <div>
              <div className="eyebrow">POSITION DETAIL</div>
              <h2>
                Holdings{" "}
                <span>{d.holdings.length.toString().padStart(2, "0")}</span>
              </h2>
            </div>
            <Link className="quiet-link" to="/markets">
              Find an idea <ArrowRight size={14} />
            </Link>
          </div>
          <Holdings holdings={d.holdings} />
        </section>
        <section className="section-plain reveal">
          <div className="section-heading-line">
            <div>
              <div className="eyebrow">EXPOSURE</div>
              <h2>Allocation</h2>
            </div>
          </div>
          <Allocation d={d} />
          <div className="standouts">
            <div className="eyebrow">RELATIVE PERFORMANCE</div>
            {[best, worst].filter(Boolean).map((h, i) => (
              <Link
                key={h.symbol}
                to={"/stocks/" + h.symbol}
                className="standout-line"
              >
                <span>{i ? "LAGGING" : "LEADING"}</span>
                <b>{h.symbol}</b>
                <strong className={h.price >= h.avg ? "positive" : "negative"}>
                  {((h.price / h.avg - 1) * 100).toFixed(2)}%
                </strong>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default Portfolio;

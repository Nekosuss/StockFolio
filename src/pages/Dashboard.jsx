import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import gsap from "gsap";
import { MarketHeadlines } from "../components/dashboard/MarketHeadlines.jsx";
import { Holdings } from "../components/dashboard/Holdings.jsx";
import { Allocation } from "../components/dashboard/Allocation.jsx";
import { WatchRows } from "../components/dashboard/WatchRows.jsx";
import { ActivityTimeline } from "../components/dashboard/ActivityTimeline.jsx";
import { TradeModal } from "../components/common/TradeModal.jsx";
import { marketStocks } from "../constants/data.js";
import { money } from "../utils/formatters.js";

export function Dashboard({ d, notify }) {
  const [range, setRange] = useState("1M");
  const [trade, setTrade] = useState(null);
  const nav = useNavigate();
  const numberRef = useRef(null),
    chartRef = useRef(null),
    tickerRef = useRef(null);

  const points = useMemo(() => {
    const start = d.invested || d.total * 0.91,
      end = d.total || 0,
      days =
        { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "1Y": 365, ALL: 730 }[range] ||
        30,
      count = range === "1D" ? 24 : range === "1W" ? 28 : 40;
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1),
        drift = start + (end - start) * t,
        wave =
          (Math.sin(i * 0.83) * Math.max(25, Math.abs(end - start) * 0.026) +
            Math.sin(i * 0.31) * Math.max(12, Math.abs(end - start) * 0.012)) *
          Math.sin(Math.PI * t),
        date = new Date(Date.now() - days * (1 - t) * 86400000);
      return {
        day:
          range === "1D"
            ? date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              }),
        value: Math.max(0, Math.round(d.total ? drift + wave : 0)),
      };
    });
  }, [d.total, d.invested, range]);

  const allocation = Object.entries(
    d.holdings.reduce(
      (a, h) => ((a[h.sector] = (a[h.sector] || 0) + h.qty * h.price), a),
      {},
    ),
  ).map(([name, value]) => ({ name, value }));

  const daily = d.holdings.reduce(
    (sum, h) => sum + (h.qty * h.price * (h.change || 0)) / 100,
    0,
  );

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let el = null,
      tween = null,
      pause = null,
      resume = null;
    const ctx = gsap.context(() => {
      if (numberRef.current) {
        if (reduced) {
          numberRef.current.textContent = money(d.total, 2);
          numberRef.current.dataset.value = d.total;
        } else {
          const counter = {
            value: Number(numberRef.current.dataset.value || 0),
          };
          gsap.to(counter, {
            value: d.total,
            duration: 1.05,
            ease: "power2.out",
            onUpdate: () => {
              if (numberRef.current)
                numberRef.current.textContent = money(counter.value, 2);
            },
            onComplete: () => {
              if (numberRef.current) numberRef.current.dataset.value = d.total;
            },
          });
        }
      }
      if (!reduced && chartRef.current)
        gsap.fromTo(
          chartRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.75, ease: "power2.out", delay: 0.1 },
        );
      if (!reduced && tickerRef.current) {
        tween = gsap.to(tickerRef.current, {
          xPercent: -50,
          duration: 34,
          ease: "none",
          repeat: -1,
        });
        el = tickerRef.current.parentElement;
        pause = () => tween.pause();
        resume = () => tween.resume();
        el?.addEventListener("mouseenter", pause);
        el?.addEventListener("mouseleave", resume);
      }
    });
    return () => {
      ctx.revert();
      el?.removeEventListener("mouseenter", pause);
      el?.removeEventListener("mouseleave", resume);
      tween?.kill();
    };
  }, [d.total]);

  const watched = d.watch
    .map(
      (symbol) =>
        d.holdings.find((h) => h.symbol === symbol) ||
        marketStocks.find((s) => s.symbol === symbol),
    )
    .filter(Boolean)
    .slice(0, 5);

  const ret = d.invested ? (d.profit / d.invested) * 100 : 0;

  return (
    <div className="dashboard-editorial">
      <div className="market-ribbon">
        <MarketHeadlines tickerRef={tickerRef} />
      </div>
      <section className="portfolio-hero reveal">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">
              PORTFOLIO VALUE{" "}
              <span className="hero-date">· PERSONAL ACCOUNT</span>
            </div>
            <div className="hero-number" ref={numberRef}>
              {money(d.total, 2)}
            </div>
            <div className="hero-return">
              <span className={d.profit >= 0 ? "positive" : "negative"}>
                {d.profit >= 0 ? "+" : "−"}
                {money(Math.abs(d.profit), 2)}
              </span>
              <span
                className={
                  d.profit >= 0 ? "return-chip-up" : "return-chip-down"
                }
              >
                {d.profit >= 0 ? "+" : ""}
                {ret.toFixed(2)}%
              </span>
              <span className="hero-period">since purchase</span>
            </div>
          </div>
          <div className="hero-benchmark">
            <span className="benchmark-glyph">
              <ChartNoAxesCombined size={17} />
            </span>
            <span>
              <small>PORTFOLIO INSIGHT</small>
              <b>
                {ret >= 0
                  ? "Your holdings are ahead of cost basis"
                  : "Your holdings are below cost basis"}
              </b>
              <i>Unrealized performance · {d.holdings.length} positions</i>
            </span>
          </div>
        </div>
        <div className="hero-chart-frame" ref={chartRef}>
          <div className="chart-side-label">
            VALUE <span>INR</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 18, right: 5, left: 5, bottom: 0 }}
            >
              <defs>
                <linearGradient id="portfolioWash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#426B4F" stopOpacity={0.22} />
                  <stop offset="78%" stopColor="#426B4F" stopOpacity={0.035} />
                  <stop offset="100%" stopColor="#426B4F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#DDDCD5"
                vertical={false}
                strokeDasharray="2 8"
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#3a443e", fontSize: 10, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                interval={
                  range === "1D"
                    ? 3
                    : range === "1W"
                      ? 5
                      : range === "1M"
                        ? 4
                        : range === "3M"
                          ? 2
                          : 0
                }
              />
              <YAxis hide domain={["dataMin - 160", "dataMax + 160"]} />
              <Tooltip
                cursor={{ stroke: "#426B4F66", strokeDasharray: "3 5" }}
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1px solid #DDDCD5",
                  borderRadius: 3,
                  color: "#171A18",
                  fontSize: 11,
                }}
                labelStyle={{ color: "#172019", fontSize: 10, fontWeight: 600 }}
                formatter={(v) => [money(v, 2), "Portfolio value"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#426B4F"
                strokeWidth={2.2}
                fill="url(#portfolioWash)"
                activeDot={{
                  r: 4,
                  fill: "#426B4F",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                isAnimationActive
                animationDuration={1100}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="hero-chart-footer">
          <div className="chart-legend">
            <span />
            <i>PORTFOLIO VALUE</i>
            <small>·</small>
            <span className="legend-invested" />
            <i>INVESTED BASIS</i>
          </div>
          <div className="range-controls range-controls-editorial">
            {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((r) => (
              <button
                key={r}
                className={range === r ? "range-active" : ""}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="portfolio-ledger reveal">
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
            {ret.toFixed(2)}% overall
          </i>
        </div>
        <div className="ledger-cell">
          <small>AVAILABLE TO INVEST</small>
          <b>{money(d.cash, 2)}</b>
          <i>Virtual cash balance</i>
        </div>
        <div className="ledger-note">
          <span>TODAY’S MOVE</span>
          <b className={daily >= 0 ? "positive" : "negative"}>
            {daily >= 0 ? "+" : "−"}
            {money(Math.abs(daily), 2)}
          </b>
          <i>Indicative daily change</i>
        </div>
      </div>
      <div className="dashboard-columns dashboard-columns-wide">
        <section className="section-plain holdings-section reveal">
          <div className="section-heading-line">
            <div>
              <div className="eyebrow">WHAT YOU OWN</div>
              <h2>
                Holdings{" "}
                <span>{d.holdings.length.toString().padStart(2, "0")}</span>
              </h2>
            </div>
            <Link className="quiet-link" to="/portfolio">
              Full portfolio <ArrowRight size={14} />
            </Link>
          </div>
          <Holdings holdings={d.holdings} />
        </section>
        <section className="section-plain allocation-section reveal">
          <div className="section-heading-line">
            <div>
              <div className="eyebrow">WHERE IT’S INVESTED</div>
              <h2>Allocation</h2>
            </div>
            <Link className="quiet-link" to="/portfolio">
              Details <ArrowRight size={14} />
            </Link>
          </div>
          <Allocation d={d} />
        </section>
      </div>
      <div className="dashboard-columns dashboard-columns-secondary">
        <section className="section-plain watch-section reveal">
          <div className="section-heading-line">
            <div>
              <div className="eyebrow">MARKET RADAR</div>
              <h2>
                Watchlist{" "}
                <span>{watched.length.toString().padStart(2, "0")}</span>
              </h2>
            </div>
            <Link className="quiet-link" to="/watchlist">
              View list <ArrowRight size={14} />
            </Link>
          </div>
          <WatchRows items={watched} />
        </section>
        <section className="section-plain activity-section reveal">
          <div className="section-heading-line">
            <div>
              <div className="eyebrow">THE PAPER TRAIL</div>
              <h2>Recent activity</h2>
            </div>
            <Link className="quiet-link" to="/transactions">
              All activity <ArrowRight size={14} />
            </Link>
          </div>
          {d.tx.length ? (
            <ActivityTimeline tx={d.tx.slice(0, 4)} />
          ) : (
            <div className="timeline-empty">
              Your virtual trades will appear here.
            </div>
          )}
        </section>
      </div>
      {trade && (
        <TradeModal
          stock={trade}
          onClose={() => setTrade(null)}
          onTrade={async (type, n) => {
            try {
              await d.trade(trade, type, n);
              setTrade(null);
              notify(`${type === "BUY" ? "Buy" : "Sell"} order complete`);
            } catch (e) {
              notify(e.response?.data?.error || e.message);
            }
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;

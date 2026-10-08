import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";
import { StockAvatar } from "../components/common/StockAvatar.jsx";
import { TradeModal } from "../components/common/TradeModal.jsx";
import { money } from "../utils/formatters.js";

export function StockPage({ d, notify }) {
  const { symbol } = useParams(),
    navigate = useNavigate();
  const emptyStock = {
    symbol,
    name: symbol,
    price: null,
    change: 0,
    exchange: "NSE",
    currency: "INR",
  };
  const [stock, setStock] = useState(emptyStock),
    [history, setHistory] = useState([]),
    [modal, setModal] = useState(""),
    [range, setRange] = useState("1M"),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (!token) {
      setLoading(false);
      setLoadError(true);
      return;
    }
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);
    setLoadError(false);
    Promise.all([
      axios.get(`/api/stocks/${symbol}`, { headers }),
      axios.get(`/api/stocks/${symbol}/history?range=${range}`, { headers }),
    ])
      .then(([quote, series]) => {
        if (!active) return;
        setStock(quote.data.stock);
        setHistory(
          (series.data.history || []).map((p) => {
            const date = new Date(p.date);
            return {
              day:
                range === "1D"
                  ? date.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                      timeZone: "Asia/Kolkata",
                    })
                  : date.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      timeZone: "Asia/Kolkata",
                    }),
              value: p.close,
            };
          }),
        );
      })
      .catch(() => {
        if (active) {
          setStock(emptyStock);
          setHistory([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [symbol, range]);

  const hasQuote =
    Number.isFinite(Number(stock.price)) && Number(stock.price) > 0;

  return (
    <>
      <div className="stock-back">
        <Link to="/markets">
          <ArrowLeft size={15} /> Markets
        </Link>
        <span>/</span>
        {symbol}
      </div>
      <div className="stock-hero">
        <div className="stock-heading">
          <StockAvatar symbol={symbol} />
          <div>
            <div className="eyebrow">
              {stock.sector?.toUpperCase() || "NSE EQUITY"} · NSE · INR
            </div>
            <h1>{stock.name || symbol}</h1>
            <span>
              {symbol} <span className="dot-sep">·</span> Common stock
            </span>
          </div>
        </div>
        <div className="stock-price">
          <b>{hasQuote ? money(stock.price, 2) : loading ? "Loading…" : "—"}</b>
          <span className={stock.change >= 0 ? "positive" : "negative"}>
            {hasQuote
              ? `${stock.change >= 0 ? "+" : ""}${money((stock.price * stock.change) / 100, 2)} (${Number(stock.change || 0).toFixed(2)}%) today`
              : loadError
                ? "Live quote unavailable"
                : "Fetching quote"}
          </span>
        </div>
      </div>
      <div className="stock-actions">
        <button
          className="btn btn-primary"
          disabled={!hasQuote}
          onClick={() => hasQuote && setModal("BUY")}
        >
          <ArrowDownLeft size={16} /> Buy
        </button>
        <button
          className="btn btn-outline"
          disabled={!hasQuote}
          onClick={() => hasQuote && setModal("SELL")}
        >
          <ArrowUpRight size={16} /> Sell
        </button>
        <button
          className="btn btn-outline"
          disabled={!hasQuote}
          onClick={() => {
            d.setWatch((w) =>
              w.includes(symbol)
                ? w.filter((x) => x !== symbol)
                : [...w, symbol],
            );
            notify(
              d.watch.includes(symbol)
                ? "Removed from watchlist"
                : "Added to watchlist",
            );
          }}
        >
          <Plus size={16} />{" "}
          {d.watch.includes(symbol) ? "Watching" : "Add to watchlist"}
        </button>
      </div>
      <section className="panel stock-chart-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">PRICE PERFORMANCE</div>
            <h2>
              {hasQuote ? money(stock.price, 2) : "—"}{" "}
              <span className={stock.change >= 0 ? "positive" : "negative"}>
                {hasQuote
                  ? `${stock.change >= 0 ? "+" : ""}${Number(stock.change || 0).toFixed(2)}%`
                  : ""}
              </span>
            </h2>
          </div>
          <div className="range-controls">
            {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"].map((r) => (
              <button
                className={range === r ? "range-active" : ""}
                key={r}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="stock-chart">
          {history.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#426B4F" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#426B4F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#E8E7E1"
                  vertical={false}
                  strokeDasharray="3 6"
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#3a443e", fontSize: 10, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.ceil(history.length / 6) - 1)}
                />
                <YAxis
                  orientation="right"
                  tick={{ fill: "#3a443e", fontSize: 10, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #DDDCD5",
                    borderRadius: 10,
                    color: "#171A18",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#426B4F"
                  strokeWidth={2}
                  fill="url(#stockFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              {loading
                ? "Loading price history…"
                : loadError
                  ? "Sign in and confirm the market-data provider is available to load this quote."
                  : "No historical prices are available for this range."}
            </div>
          )}
        </div>
      </section>
      <div className="stock-facts">
        {[
          ["EXCHANGE", stock.exchange || "NSE"],
          ["CURRENCY", stock.currency || "INR"],
          ["DAY HIGH", stock.dayHigh ? money(stock.dayHigh, 2) : "—"],
          ["DAY LOW", stock.dayLow ? money(stock.dayLow, 2) : "—"],
          [
            "VOLUME",
            stock.volume ? Number(stock.volume).toLocaleString("en-IN") : "—",
          ],
        ].map(([a, b]) => (
          <div className="panel stock-fact" key={a}>
            <small>{a}</small>
            <b>{b}</b>
          </div>
        ))}
      </div>
      <p className="disclaimer-note">
        <ShieldCheck size={14} /> Provider market data may be delayed. Virtual
        orders only; no real orders are placed.
      </p>
      {modal && (
        <TradeModal
          stock={stock}
          owned={d.holdings.find((h) => h.symbol === symbol)?.qty || 0}
          initialType={modal}
          onClose={() => setModal("")}
          onTrade={async (type, n) => {
            try {
              await d.trade(stock, type, n);
              setModal("");
              notify(`${type === "BUY" ? "Buy" : "Sell"} order complete`);
            } catch (e) {
              notify(e.response?.data?.error || e.message);
            }
          }}
        />
      )}
    </>
  );
}

export default StockPage;

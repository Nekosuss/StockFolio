import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ShieldCheck } from "lucide-react";
import axios from "axios";
import { PageHeading } from "../components/layout/PageHeading.jsx";
import { SearchBox } from "../components/common/SearchBox.jsx";
import { StockAvatar } from "../components/common/StockAvatar.jsx";
import { marketStocks } from "../constants/data.js";
import { cx, money } from "../utils/formatters.js";

export function Markets({ query, setQuery, watch, setWatch, notify }) {
  const [filter, setFilter] = useState("All stocks"),
    [stocks, setStocks] = useState([]),
    [live, setLive] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (!token) return;
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all(
      marketStocks.map((s) =>
        axios
          .get(`/api/stocks/${s.symbol}`, { headers })
          .then((r) => ({
            ...s,
            ...r.data.stock,
            sector: r.data.stock.sector || s.sector,
          }))
          .catch(() => null),
      ),
    ).then((rows) => {
      if (active) {
        const quotes = rows.filter(Boolean);
        setStocks(quotes);
        setLive(quotes.some((s) => s.source === "live"));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (!token) {
      setStocks([]);
      setLive(false);
      return;
    }
    if (query.trim().length < 2) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const result = await axios.get(
          `/api/stocks/search?q=${encodeURIComponent(query.trim())}`,
          { headers },
        );
        const rows = (
          await Promise.all(
            (result.data.results || []).slice(0, 10).map((s) =>
              axios
                .get(`/api/stocks/${s.symbol}`, { headers })
                .then((r) => ({
                  ...s,
                  ...r.data.stock,
                  name: r.data.stock.name || s.name,
                  sector: r.data.stock.sector || "Other",
                }))
                .catch(() => null),
            ),
          )
        ).filter(Boolean);
        if (active) {
          setStocks(rows);
          setLive(rows.some((s) => s.source === "live"));
        }
      } catch {
        if (active) {
          setStocks([]);
          setLive(false);
        }
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const found = stocks.filter(
    (s) =>
      (s.symbol + " " + s.name).toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All stocks" ||
        (filter === "Watchlist" ? watch.includes(s.symbol) : s.change >= 0)),
  );

  return (
    <>
      <PageHeading
        eyebrow="THE MARKET, IN CONTEXT"
        title="Explore markets."
        description="Keep an eye on the companies shaping your portfolio."
      />
      <div className="market-toolbar">
        <SearchBox query={query} setQuery={setQuery} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All stocks</option>
          <option>Watchlist</option>
          <option>Gainers</option>
        </select>
      </div>
      <section className="panel market-table-panel">
        <div className="panel-head">
          <div>
            <div className="eyebrow">CURATED FOR YOU</div>
            <h2>Stocks to explore</h2>
          </div>
          <span className="data-note">
            <span className="pulse" />{" "}
            {live
              ? "Live NSE quotes"
              : localStorage.getItem("sf_token")
                ? "NSE quotes unavailable"
                : "Sign in for NSE quotes"}
          </span>
        </div>
        <div className="table-scroll">
          <table className="data-table market-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>PRICE</th>
                <th>CHANGE</th>
                <th>SECTOR</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {found.map((s) => (
                <tr key={s.symbol}>
                  <td>
                    <Link to={"/stocks/" + s.symbol} className="company-cell">
                      <StockAvatar symbol={s.symbol} />
                      <span>
                        <b>{s.symbol}</b>
                        <small>{s.name}</small>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <b>{money(s.price, 2)}</b>
                  </td>
                  <td>
                    <span
                      className={cx(
                        "return-tag",
                        s.change >= 0 ? "positive-bg" : "negative-bg",
                      )}
                    >
                      {s.change >= 0 ? "+" : ""}
                      {s.change}%
                    </span>
                  </td>
                  <td>
                    <span className="sector-pill">{s.sector}</span>
                  </td>
                  <td>
                    <button
                      className={cx(
                        "watch-toggle",
                        watch.includes(s.symbol) && "watch-on",
                      )}
                      onClick={() => {
                        setWatch((w) =>
                          watch.includes(s.symbol)
                            ? w.filter((x) => x !== s.symbol)
                            : [...w, s.symbol],
                        );
                        notify(
                          watch.includes(s.symbol)
                            ? "Removed from watchlist"
                            : "Added to watchlist",
                        );
                      }}
                    >
                      {watch.includes(s.symbol) ? (
                        "Watching"
                      ) : (
                        <>
                          <Plus size={14} /> Watch
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!found.length && (
            <div className="empty-state">
              <Search size={24} />
              {localStorage.getItem("sf_token") ? (
                <>
                  <b>No stocks found</b>
                  <p>Try another name or ticker symbol.</p>
                </>
              ) : (
                <>
                  <b>Sign in for NSE quotes</b>
                  <p>
                    Log in or create an account to load quotes from your
                    configured provider.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </section>
      <p className="disclaimer-note">
        <ShieldCheck size={14} /> Market quotes depend on the configured
        provider and may be delayed. Virtual orders only; no real money is
        traded.
      </p>
    </>
  );
}

export default Markets;

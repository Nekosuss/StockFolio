import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ShieldCheck, Watch } from "lucide-react";
import axios from "axios";
import { PageHeading } from "../components/layout/PageHeading.jsx";
import { SearchBox } from "../components/common/SearchBox.jsx";
import { WatchRows } from "../components/dashboard/WatchRows.jsx";

export function Watchlist({ d, query, setQuery, notify }) {
  const [quotes, setQuotes] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (!token || !d.watch.length) {
      setQuotes({});
      return;
    }
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all(
      d.watch.map((symbol) =>
        axios
          .get(`/api/stocks/${symbol}`, { headers })
          .then((r) => [symbol, r.data.stock])
          .catch(() => [symbol, null]),
      ),
    ).then((rows) => {
      if (active)
        setQuotes(Object.fromEntries(rows.filter(([, quote]) => quote)));
    });
    return () => {
      active = false;
    };
  }, [d.watch.join(",")]);

  const items = d.watch
    .map(
      (symbol) => d.holdings.find((h) => h.symbol === symbol) || quotes[symbol],
    )
    .filter(Boolean)
    .filter((s) =>
      (s.symbol + " " + s.name).toLowerCase().includes(query.toLowerCase()),
    );

  const authenticated = Boolean(localStorage.getItem("sf_token"));

  return (
    <>
      <PageHeading
        eyebrow="THE NAMES ON YOUR RADAR"
        title="Watchlist."
        description="Track NSE quotes for the companies in your list."
        action={
          <Link className="btn btn-primary" to="/markets">
            <Plus size={15} /> Add symbols
          </Link>
        }
      />
      <div className="market-toolbar">
        <SearchBox
          query={query}
          setQuery={setQuery}
          placeholder="Filter your watchlist…"
        />
        <span className="count-badge">{items.length} symbols</span>
      </div>
      <section className="watchlist-ledger">
        <div className="watchlist-ledger-head">
          <span>COMPANY</span>
          <span>RECENT TREND</span>
          <span>PRICE</span>
          <span>CHANGE</span>
          <span />
        </div>
        <WatchRows
          items={items}
          onRemove={(symbol) => {
            d.setWatch(d.watch.filter((x) => x !== symbol));
            notify("Removed from watchlist");
          }}
          empty={
            <div className="empty-state">
              <Watch size={24} />
              <b>
                {authenticated
                  ? "Your watchlist is clear"
                  : "Sign in for NSE quotes"}
              </b>
              <p>
                {authenticated
                  ? "Add companies from Markets to keep them close."
                  : "Log in or create an account to load your watchlist."}
              </p>
              <Link
                to={authenticated ? "/markets" : "/login"}
                className="btn btn-primary"
              >
                {authenticated ? "Explore markets" : "Log in"}
              </Link>
            </div>
          }
        />
      </section>
      <p className="disclaimer-note">
        <ShieldCheck size={14} /> Prices use the configured market-data
        provider. Trend sparklines are illustrative.
      </p>
    </>
  );
}

export default Watchlist;

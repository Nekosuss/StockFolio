import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Search, X } from "lucide-react";
import axios from "axios";
import { StockAvatar } from "../common/StockAvatar.jsx";
import { nav } from "../../constants/data.js";

export function GlobalSearch({ close }) {
  const [q, setQ] = useState(""),
    [results, setResults] = useState([]),
    [searching, setSearching] = useState(false),
    navigate = useNavigate();

  useEffect(() => {
    function key(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [close]);

  useEffect(() => {
    const query = q.trim(),
      token = localStorage.getItem("sf_token");
    if (query.length < 2 || !token) {
      setResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await axios.get(
          `/api/stocks/search?q=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (active) setResults(response.data.results || []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  const authenticated = Boolean(localStorage.getItem("sf_token"));

  return (
    <div
      className="global-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="global-search">
        <div className="global-input">
          <Search size={18} />
          <input
            autoFocus
            placeholder="Search NSE stocks and companies…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <kbd>ESC</kbd>
          <button onClick={close}>
            <X size={16} />
          </button>
        </div>
        {q ? (
          <>
            <div className="global-result-label">NSE STOCKS</div>
            {results.map((s) => (
              <button
                key={s.symbol}
                className="global-result"
                onClick={() => {
                  close();
                  navigate("/stocks/" + s.symbol);
                }}
              >
                <StockAvatar symbol={s.symbol} />
                <span>
                  <b>{s.symbol}</b>
                  <small>{s.name}</small>
                </span>
                <ArrowUpRight size={13} />
              </button>
            ))}
            {searching && (
              <p className="global-empty">Searching NSE listings…</p>
            )}
            {!searching && !results.length && (
              <p className="global-empty">
                {authenticated
                  ? "No matching NSE listings found."
                  : "Log in to search live NSE listings."}
              </p>
            )}
          </>
        ) : (
          <div className="global-hints">
            <span>QUICK LINKS</span>
            {nav.map(([label, path, Icon]) => (
              <button
                key={label}
                onClick={() => {
                  close();
                  navigate(path);
                }}
              >
                <Icon size={15} />
                {label}
                <kbd>↵</kbd>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalSearch;

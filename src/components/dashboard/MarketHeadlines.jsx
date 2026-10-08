import React, { useEffect, useState } from "react";
import axios from "axios";

export function MarketHeadlines({ tickerRef }) {
  const [headlines, setHeadlines] = useState([]),
    [status, setStatus] = useState("loading");

  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (!token) {
      setStatus("signin");
      return;
    }
    let active = true;
    const refresh = async () => {
      try {
        const response = await axios.get("/api/market/headlines", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) {
          const rows = response.data.headlines || [];
          setHeadlines(rows);
          setStatus(rows.length ? "ready" : "unavailable");
        }
      } catch {
        if (active) setStatus("unavailable");
      }
    };
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const fmt = (value) =>
    Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      <div className="market-ribbon-label">
        <span className="live-beacon" />
        {status === "ready" ? "LIVE MARKET HEADLINES" : "NSE MARKET HEADLINES"}
      </div>
      <div className="ticker-window">
        <div className="ticker-track" ref={tickerRef}>
          {headlines.length ? (
            [...headlines, ...headlines].map((item, index) => (
              <div className="ticker-quote" key={item.name + index}>
                <span>{item.name}</span>
                <b>{fmt(item.price)}</b>
                <i className={item.change < 0 ? "negative" : "positive"}>
                  {item.change >= 0 ? "+" : ""}
                  {Number(item.change).toFixed(2)}%
                </i>
              </div>
            ))
          ) : (
            <span className="ribbon-time">
              {status === "signin"
                ? "Log in to load live index quotes"
                : status === "unavailable"
                  ? "Live index quotes unavailable"
                  : "Loading live index quotes…"}
            </span>
          )}
        </div>
      </div>
      <span className="ribbon-time">NIFTY · SENSEX</span>
    </>
  );
}

export default MarketHeadlines;

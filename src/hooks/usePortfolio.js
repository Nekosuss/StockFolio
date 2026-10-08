import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { seed } from "../constants/data.js";

export function usePortfolio() {
  const location = useLocation();
  const [holdings, setHoldings] = useState(
    () => JSON.parse(localStorage.getItem("sf_holdings") || "null") || seed,
  );
  const [cash, setCash] = useState(() =>
    Number(localStorage.getItem("sf_cash") || "1000000"),
  );
  const [watch, setWatch] = useState(() =>
    JSON.parse(localStorage.getItem("sf_watch") || '["NVDA","AAPL","MSFT"]'),
  );
  const [tx, setTx] = useState(() =>
    JSON.parse(localStorage.getItem("sf_tx") || "[]"),
  );

  useEffect(() => {
    localStorage.setItem("sf_holdings", JSON.stringify(holdings));
    localStorage.setItem("sf_cash", cash);
    localStorage.setItem("sf_watch", JSON.stringify(watch));
    localStorage.setItem("sf_tx", JSON.stringify(tx));
  }, [holdings, cash, watch, tx]);

  useEffect(() => {
    const token = localStorage.getItem("sf_token");
    if (!token) return;
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get("/api/portfolio", { headers }),
      axios.get("/api/holdings", { headers }),
      axios.get("/api/transactions", { headers }),
      axios.get("/api/watchlist", { headers }),
    ])
      .then(([p, h, t, w]) => {
        if (!active) return;
        setCash(p.data.cashBalance);
        setHoldings(
          h.data.holdings.map((x) => ({
            ...x,
            qty: x.quantity,
            avg: x.averageBuyPrice,
            price: x.quote.price,
            change: x.quote.change || 0,
            sector: x.quote.sector || "Other",
            name: x.companyName,
          })),
        );
        setTx(
          t.data.transactions.map((x) => ({
            id: x._id,
            symbol: x.symbol,
            name: x.companyName,
            type: x.type,
            qty: x.quantity,
            price: x.price,
            total: x.totalValue,
            time: x.timestamp,
          })),
        );
        setWatch(w.data.watchlist.map((x) => x.symbol));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [location.pathname]);

  function updateWatch(next) {
    const updated = typeof next === "function" ? next(watch) : next;
    setWatch(updated);
    const token = localStorage.getItem("sf_token");
    if (token) {
      const headers = { Authorization: `Bearer ${token}` };
      const added = updated.filter((x) => !watch.includes(x)),
        removed = watch.filter((x) => !updated.includes(x));
      Promise.all([
        ...added.map((symbol) =>
          axios.post("/api/watchlist", { symbol }, { headers }),
        ),
        ...removed.map((symbol) =>
          axios.delete(`/api/watchlist/${symbol}`, { headers }),
        ),
      ]).catch(() => {});
    }
  }

  const total = holdings.reduce((a, h) => a + h.qty * h.price, 0);
  const invested = holdings.reduce((a, h) => a + h.qty * h.avg, 0);

  async function trade(stock, type, qty) {
    const token = localStorage.getItem("sf_token");
    if (token) {
      const result = await axios.post(
        `/api/trades/${type.toLowerCase()}`,
        { symbol: stock.symbol, quantity: qty },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (result.data.price) stock = { ...stock, price: result.data.price };
    }
    const total = qty * stock.price;
    if (type === "BUY" && total > cash)
      throw Error("Not enough virtual cash for this order.");
    const owned = holdings.find((h) => h.symbol === stock.symbol);
    if (type === "SELL" && (!owned || qty > owned.qty))
      throw Error("You don’t own enough shares to sell.");
    setHoldings((old) => {
      const found = old.find((h) => h.symbol === stock.symbol);
      if (type === "BUY") {
        if (!found) return [...old, { ...stock, qty, avg: stock.price }];
        return old.map((h) =>
          h.symbol !== stock.symbol
            ? h
            : {
                ...h,
                avg: (h.avg * h.qty + stock.price * qty) / (h.qty + qty),
                qty: h.qty + qty,
              },
        );
      }
      return old
        .map((h) =>
          h.symbol === stock.symbol ? { ...h, qty: h.qty - qty } : h,
        )
        .filter((h) => h.qty > 0);
    });
    setCash((c) => c + (type === "BUY" ? -total : total));
    setTx((old) => [
      {
        id: Date.now(),
        symbol: stock.symbol,
        name: stock.name,
        type,
        qty,
        price: stock.price,
        total,
        time: new Date().toISOString(),
      },
      ...old,
    ]);
  }

  return {
    holdings,
    cash,
    watch,
    setWatch: updateWatch,
    tx,
    trade,
    total,
    invested,
    profit: total - invested,
  };
}

export default usePortfolio;

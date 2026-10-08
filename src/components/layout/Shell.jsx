import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Globe2,
  LogOut,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import axios from "axios";
import { BrandMark } from "../common/BrandMark.jsx";
import { GlobalSearch } from "./GlobalSearch.jsx";
import { nav } from "../../constants/data.js";
import { cx, money } from "../../utils/formatters.js";

export function Shell({
  children,
  user,
  query,
  setQuery,
  transactions = [],
  onLogout,
}) {
  const location = useLocation();
  const [mobile, setMobile] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [marketMode, setMarketMode] = useState("checking"),
    [activeMenu, setActiveMenu] = useState("");
  const actionsRef = useRef(null);

  useEffect(() => {
    axios
      .get("/api/health")
      .then((r) => setMarketMode(r.data.mode || "unavailable"))
      .catch(() => setMarketMode("unavailable"));
  }, []);

  const marketLabel =
    marketMode === "upstox"
      ? "Upstox · NSE"
      : marketMode === "twelvedata"
        ? "Twelve Data · NSE"
        : marketMode === "finnhub"
          ? "Finnhub"
          : marketMode === "mock"
            ? "Demo data"
            : marketMode === "checking"
              ? "Checking data…"
              : "Market data unavailable";

  useEffect(() => {
    function shortcut(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    function dismiss(e) {
      if (e.key === "Escape") setActiveMenu("");
      if (!actionsRef.current?.contains(e.target)) setActiveMenu("");
    }
    window.addEventListener("keydown", shortcut);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      window.removeEventListener("keydown", shortcut);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className={cx("sidebar", mobile && "sidebar-open")}>
        <Link to="/" className="brand" aria-label="Stockfolio home">
          <BrandMark />
          stockfolio
        </Link>
        <div className="workspace-switch">
          <div className="workspace-icon">{(user || "A")[0].toUpperCase()}</div>
          <span>
            <b>Personal workspace</b>
            <small>Virtual account</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {nav.map(([n, path, I]) => (
            <NavLink
              key={path}
              onClick={() => setMobile(false)}
              to={path}
              className={({ isActive }) =>
                cx("side-link", isActive && "side-active")
              }
            >
              <I size={17} />
              {n}
              {n === "Activity" && <span className="nav-count">{0}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="side-label markets-label">MARKETS</div>
        <Link className="market-quick" to="/markets">
          <div>
            <span className="market-dot" />
            NSE EQUITIES
          </div>
          <b>Browse stocks</b>
        </Link>
        <div className="sidebar-spacer" />
        <div className="side-bottom">
          <Link to="/settings" className="side-link">
            <Settings size={17} />
            Settings
          </Link>
          <a className="side-link" href="mailto:hello@stockfolio.app">
            <CircleHelp size={17} />
            Help & support
          </a>
          <div className="user-card">
            <div className="user-avatar">{(user || "A")[0].toUpperCase()}</div>
            <span>
              <b>{user || "Alex Morgan"}</b>
              <small>Personal account</small>
            </span>
            <button onClick={onLogout} title="Log out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobile(!mobile)}>
            <Menu size={19} />
          </button>
          <div className="breadcrumbs">
            Workspace <span>/</span>{" "}
            <b>
              {nav.find((n) => n[1] === location.pathname)?.[0] || "Overview"}
            </b>
          </div>
          <div className="topbar-actions" ref={actionsRef}>
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={15} />
              <span>Search anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="market-status">
              <span className="pulse" />
              {marketLabel}
            </div>
            <div className="topbar-menu-wrap">
              <button
                className="icon-btn"
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={activeMenu === "notifications"}
                onClick={() =>
                  setActiveMenu(
                    activeMenu === "notifications" ? "" : "notifications",
                  )
                }
              >
                <Bell size={17} />
                {transactions.length > 0 && <i />}
              </button>
              {activeMenu === "notifications" && (
                <section className="topbar-popover" aria-label="Notifications">
                  <div className="popover-heading">
                    <b>Notifications</b>
                    <span>
                      {transactions.length
                        ? `${transactions.length} recent updates`
                        : "All caught up"}
                    </span>
                  </div>
                  {transactions.length ? (
                    transactions.slice(0, 4).map((item) => (
                      <Link
                        className="popover-item"
                        key={item.id}
                        to="/transactions"
                        onClick={() => setActiveMenu("")}
                      >
                        <span className="popover-icon">
                          <Activity size={15} />
                        </span>
                        <span>
                          <b>
                            {item.type === "BUY"
                              ? "Buy order recorded"
                              : "Sell order recorded"}
                          </b>
                          <small>
                            {item.symbol} · {item.qty} shares ·{" "}
                            {money(item.total, 2)}
                          </small>
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="popover-empty">
                      <Bell size={17} />
                      <span>
                        You’re all caught up. New portfolio updates will appear
                        here.
                      </span>
                    </div>
                  )}
                  <Link
                    className="popover-footer"
                    to="/transactions"
                    onClick={() => setActiveMenu("")}
                  >
                    View activity <ArrowRight size={14} />
                  </Link>
                </section>
              )}
            </div>
            <div className="topbar-menu-wrap">
              <button
                className="top-avatar"
                title="Account menu"
                aria-label="Account menu"
                aria-expanded={activeMenu === "profile"}
                onClick={() =>
                  setActiveMenu(activeMenu === "profile" ? "" : "profile")
                }
              >
                {(user || "A")[0].toUpperCase()}
              </button>
              {activeMenu === "profile" && (
                <section
                  className="topbar-popover profile-popover"
                  aria-label="Account menu"
                >
                  <div className="popover-profile">
                    <span className="user-avatar">
                      {(user || "A")[0].toUpperCase()}
                    </span>
                    <span>
                      <b>{user || "Guest"}</b>
                      <small>Personal account</small>
                    </span>
                  </div>
                  <Link
                    className="popover-link"
                    to="/settings"
                    onClick={() => setActiveMenu("")}
                  >
                    <Settings size={15} /> Account settings
                  </Link>
                  <Link
                    className="popover-link"
                    to="/"
                    onClick={() => setActiveMenu("")}
                  >
                    <Globe2 size={15} /> Stockfolio home
                  </Link>
                  <button
                    className="popover-link popover-logout"
                    onClick={() => {
                      setActiveMenu("");
                      onLogout();
                    }}
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </section>
              )}
            </div>
          </div>
        </header>
        {searchOpen && <GlobalSearch close={() => setSearchOpen(false)} />}
        <div className="page-content">{children}</div>
        <footer className="app-footer">
          <span>
            STOCKFOLIO <i>·</i> VIRTUAL INVESTING, REAL CLARITY
          </span>
          <span>Quotes from the configured provider · Virtual orders only</span>
        </footer>
      </main>
    </div>
  );
}

export default Shell;

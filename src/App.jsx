import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePortfolio } from "./hooks/usePortfolio.js";
import { Shell } from "./components/layout/Shell.jsx";
import { Landing } from "./pages/Landing.jsx";
import { Auth } from "./pages/Auth.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Portfolio } from "./pages/Portfolio.jsx";
import { Markets } from "./pages/Markets.jsx";
import { Watchlist } from "./pages/Watchlist.jsx";
import { Transactions } from "./pages/Transactions.jsx";
import { StockPage } from "./pages/StockPage.jsx";
import { SettingsPage } from "./pages/SettingsPage.jsx";

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const data = usePortfolio();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(
    localStorage.getItem("sf_user") || "Alex Morgan",
  );
  const [toast, setToast] = useState("");
  const location = useLocation(),
    navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".reveal").forEach((el) =>
        gsap.fromTo(
          el,
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.62,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          },
        ),
      );
    });
    return () => ctx.revert();
  }, [location.pathname]);

  function notify(t) {
    setToast(t);
    setTimeout(() => setToast(""), 2600);
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={<Auth mode="login" setUser={setUser} />}
        />
        <Route
          path="/register"
          element={<Auth mode="register" setUser={setUser} />}
        />
        <Route
          path="*"
          element={
            <Shell
              user={user}
              query={query}
              setQuery={setQuery}
              transactions={data.tx}
              onLogout={() => {
                localStorage.removeItem("sf_user");
                localStorage.removeItem("sf_token");
                setUser("Guest");
                navigate("/");
              }}
            >
              <Routes>
                <Route
                  path="/dashboard"
                  element={<Dashboard d={data} notify={notify} />}
                />
                <Route path="/portfolio" element={<Portfolio d={data} />} />
                <Route
                  path="/markets"
                  element={
                    <Markets
                      query={query}
                      setQuery={setQuery}
                      watch={data.watch}
                      setWatch={data.setWatch}
                      notify={notify}
                    />
                  }
                />
                <Route
                  path="/watchlist"
                  element={
                    <Watchlist
                      d={data}
                      query={query}
                      setQuery={setQuery}
                      notify={notify}
                    />
                  }
                />
                <Route
                  path="/transactions"
                  element={<Transactions tx={data.tx} />}
                />
                <Route
                  path="/stocks/:symbol"
                  element={<StockPage d={data} notify={notify} />}
                />
                <Route
                  path="/settings"
                  element={<SettingsPage user={user} cash={data.cash} />}
                />
                <Route
                  path="*"
                  element={<Dashboard d={data} notify={notify} />}
                />
              </Routes>
            </Shell>
          }
        />
      </Routes>
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </>
  );
}

export default App;

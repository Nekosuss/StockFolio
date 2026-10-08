import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Compass,
  Eye,
  EyeOff,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  Watch,
  X,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import axios from "axios";
gsap.registerPlugin(ScrollTrigger);
const seed = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    sector: "Energy",
    price: 1450,
    change: 0.62,
    qty: 14,
    avg: 1390,
    color: "#426B4F",
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Limited",
    sector: "Information Technology",
    price: 3200,
    change: 0.44,
    qty: 8,
    avg: 3050,
    color: "#8C958D",
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Limited",
    sector: "Financial Services",
    price: 1700,
    change: -0.28,
    qty: 12,
    avg: 1740,
    color: "#737F76",
  },
  {
    symbol: "INFY",
    name: "Infosys Limited",
    sector: "Information Technology",
    price: 1500,
    change: 1.12,
    qty: 15,
    avg: 1440,
    color: "#A49B87",
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Limited",
    sector: "Financial Services",
    price: 1300,
    change: 0.35,
    qty: 10,
    avg: 1240,
    color: "#92968F",
  },
];
const nav = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Portfolio", "/portfolio", BriefcaseBusiness],
  ["Markets", "/markets", Compass],
  ["Watchlist", "/watchlist", Watch],
  ["Activity", "/transactions", Clock3],
];
const chartData = Array.from({ length: 26 }, (_, i) => ({
  day: new Date(Date.now() - (25 - i) * 86400000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  }),
  value: 92000 + Math.round(i * 520 + Math.sin(i * 0.8) * 1800 + i * i * 9),
}));
const money = (n, dec = 0) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
const cx = (...a) => a.filter(Boolean).join(" ");
function usePortfolio() {
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
function App() {
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
      gsap.utils
        .toArray(".reveal")
        .forEach((el) =>
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
function Landing() {
  const heroRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".landing-nav", { y: -12, opacity: 0, duration: 0.55 })
        .from(
          ".hero-copy .eyebrow",
          { y: 12, opacity: 0, duration: 0.45 },
          "-=.18",
        )
        .from(".hero h1", { y: 24, opacity: 0, duration: 0.75 }, "-=.2")
        .from(
          ".hero-copy>p,.hero-actions,.hero-proof",
          { y: 12, opacity: 0, duration: 0.5, stagger: 0.09 },
          "-=.35",
        )
        .from(".hero-visual", { y: 16, opacity: 0, duration: 0.9 }, "-=.6");
    }, ".landing");
    return () => ctx.revert();
  }, []);
  useEffect(() => {
    let effect = null,
      cancelled = false;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (window.innerWidth > 760 && !reduced && heroRef.current) {
      Promise.all([import("vanta/dist/vanta.net.min"), import("three")])
        .then(([vanta, three]) => {
          if (!cancelled) {
            const NET = vanta.default || vanta;
            effect = NET({
              el: heroRef.current,
              THREE: three.default || three,
              color: 0x426b4f,
              backgroundColor: 0xf4f2ed,
              points: 7,
              maxDistance: 22,
              spacing: 18,
              showDots: false,
              mouseControls: false,
              touchControls: false,
              gyroControls: false,
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, []);
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link to="/" className="brand">
          <BrandMark />
          stockfolio
        </Link>
        <div className="landing-links">
          <a href="#features">Why Stockfolio</a>
          <Link to="/markets">Markets</Link>
          <Link to="/login">Log in</Link>
          <Link className="btn btn-light" to="/dashboard">
            Open dashboard <ArrowRight size={15} />
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div className="vanta-layer" ref={heroRef} />
        <div className="hero-glow" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pulse" /> A clearer view of your money
          </div>
          <h1>
            Your portfolio.
            <br />
            Your market.
            <br />
            <span>Your decisions.</span>
          </h1>
          <p>
            Track your investments, understand your performance, and make every
            decision with confidence.
          </p>
          <div className="hero-actions">
            <Link to="/dashboard" className="btn btn-primary">
              Get started <ArrowRight size={16} />
            </Link>
            <a href="#preview" className="btn btn-outline">
              <Eye size={15} /> Explore demo
            </a>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack">
              <span>A</span>
              <span>M</span>
              <span>R</span>
              <span>+</span>
            </div>
            <span>Built for thoughtful investors</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="floating-chip chip-a">
            <span className="chip-icon green">
              <ArrowUpRight size={15} />
            </span>
            <span>
              <b>Portfolio up</b>
              <small>+12.84% this year</small>
            </span>
          </div>
          <div className="preview-card">
            <div className="preview-top">
              <span>PORTFOLIO VALUE</span>
              <MoreHorizontal size={18} />
            </div>
            <div className="preview-value">
              ₹12,48,520 <span>+8.6%</span>
            </div>
            <div className="preview-sub">
              Total balance <span>● Market open</span>
            </div>
            <div className="mini-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#426B4F" stopOpacity=".28" />
                      <stop offset="100%" stopColor="#426B4F" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#426B4F"
                    strokeWidth={2}
                    fill="url(#heroGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="preview-foot">
              <span>1W</span>
              <span>1M</span>
              <span className="active">3M</span>
              <span>6M</span>
              <span>1Y</span>
              <span>ALL</span>
            </div>
          </div>
          <div className="floating-chip chip-b">
            <span className="chip-icon purple">
              <Activity size={15} />
            </span>
            <span>
              <b>Markets in focus</b>
              <small>12 stocks on your list</small>
            </span>
          </div>
        </div>
      </section>
      <section className="trust-row">
        <span>YOUR FINANCIAL PICTURE, FINALLY IN FOCUS</span>
        <div>
          <span>
            <ShieldCheck size={15} /> Private by design
          </span>
          <span>
            <Globe2 size={15} /> Markets worldwide
          </span>
          <span>
            <Sparkles size={15} /> Made for clarity
          </span>
        </div>
      </section>
      <section id="features" className="features-section">
        <div className="section-intro">
          <div className="eyebrow">THE WHOLE PICTURE</div>
          <h2>
            Less noise.
            <br />
            <span>More perspective.</span>
          </h2>
          <p>
            Everything you need to understand where you stand, without the
            clutter.
          </p>
        </div>
        <div className="feature-grid">
          <Feature
            icon={Activity}
            title="Performance, in context"
            text="Follow your portfolio over time and see what’s driving your returns."
          />
          <Feature
            icon={BriefcaseBusiness}
            title="A portfolio that adds up"
            text="See holdings, cost basis, and unrealized gains in one clear view."
          />
          <Feature
            icon={Compass}
            title="Find your next idea"
            text="Explore market movers and keep the companies you care about close."
          />
          <Feature
            icon={Clock3}
            title="Every move, accounted for"
            text="Your complete virtual trading history, always easy to find."
          />
        </div>
      </section>
      <section className="preview-section" id="preview">
        <div className="preview-copy">
          <div className="eyebrow">A BETTER VIEW</div>
          <h2>
            Your money,
            <br />
            at a glance.
          </h2>
          <p>
            A calm, considered dashboard that brings your entire portfolio into
            focus. No noise. Just the details that matter.
          </p>
          <Link className="text-link" to="/dashboard">
            Take a look around <ArrowRight size={16} />
          </Link>
        </div>
        <div className="dashboard-mock">
          <div className="mock-sidebar">
            <BrandMark />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="mock-content">
            <div className="mock-header">
              <div>
                <small>MONDAY, JUNE 17</small>
                <b>Your overview</b>
              </div>
              <span className="mock-user">AM</span>
            </div>
            <div className="mock-stats">
              <div>
                <small>Total value</small>
                <b>₹12,48,520</b>
                <em>↗ 8.6%</em>
              </div>
              <div>
                <small>Invested</small>
                <b>₹10,82,000</b>
                <em>All time</em>
              </div>
            </div>
            <div className="mock-chart">
              <div>
                <small>PORTFOLIO PERFORMANCE</small>
                <b>
                  ₹12.48L <em>+8.6%</em>
                </b>
              </div>
              <div className="mock-line" />
            </div>
            <div className="mock-rows">
              <small>TOP HOLDINGS</small>
              {[
                ["NV", "NVIDIA", "+4.2%"],
                ["A", "Apple", "+1.8%"],
                ["M", "Microsoft", "−0.4%"],
              ].map((x) => (
                <div key={x[1]}>
                  <i>{x[0]}</i>
                  <span>{x[1]}</span>
                  <b>{x[2]}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="eyebrow">START WITH WHAT YOU KNOW</div>
        <h2>
          Clarity changes
          <br />
          everything.
        </h2>
        <p>Your first step toward a more thoughtful portfolio.</p>
        <Link to="/dashboard" className="btn btn-primary">
          Explore your dashboard <ArrowRight size={16} />
        </Link>
      </section>
      <footer className="landing-footer">
        <Link to="/" className="brand">
          <BrandMark />
          stockfolio
        </Link>
        <span>Virtual investing, made clear. No real money involved.</span>
        <span>© 2025 Stockfolio</span>
      </footer>
    </main>
  );
}
function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 28 28">
        <path d="M3 21h5v-6h6V9h6V5h5" />
        <path d="M3 24h22" className="mark-baseline" />
      </svg>
    </span>
  );
}
function Feature({ icon: Icon, title, text }) {
  return (
    <article className="feature-card">
      <span className="feature-icon">
        <Icon size={19} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <ArrowRight size={15} className="feature-arrow" />
    </article>
  );
}
function Auth({ mode, setUser }) {
  const nav = useNavigate(),
    [show, setShow] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [pass, setPass] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const reg = mode === "register";
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (reg && pass !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await axios.post(
        `/api/auth/${reg ? "register" : "login"}`,
        { ...(reg ? { name } : {}), email, password: pass },
      );
      localStorage.setItem("sf_token", data.token);
      localStorage.setItem("sf_user", data.user.name);
      setUser(data.user.name);
      nav("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not reach the Stockfolio API. Start the backend and MongoDB, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-side">
        <Link to="/" className="brand">
          <BrandMark />
          stockfolio
        </Link>
        <div className="auth-art">
          <div className="auth-art-circle" />
          <div className="auth-art-text">
            <span className="eyebrow">A CLEARER PICTURE</span>
            <h2>
              Your financial life,
              <br />
              in its right perspective.
            </h2>
            <p>Invest with intention. Understand every move.</p>
          </div>
          <div className="auth-art-chart">
            <div className="auth-chart-label">
              <small>PORTFOLIO PERFORMANCE</small>
              <b>↑ 12.84%</b>
            </div>
            <div className="auth-chart-line" />
          </div>
        </div>
        <span className="auth-disclaimer">
          For informational purposes. Virtual investing only.
        </span>
      </div>
      <div className="auth-main">
        <Link className="auth-back" to="/">
          <ArrowLeft size={15} /> Back to home
        </Link>
        <div className="auth-form-wrap">
          <div className="eyebrow">
            {reg ? "YOUR NEXT CHAPTER" : "WELCOME BACK"}
          </div>
          <h1>{reg ? "Create your account" : "Good to see you."}</h1>
          <p>
            {reg
              ? "Start with a clearer view of your portfolio."
              : "Pick up where you left off."}
          </p>
          <form onSubmit={submit}>
            {reg && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <div className="password-wrap">
                <input
                  type={show ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShow(!show)}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {reg && (
              <label>
                Confirm password
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Enter your password again"
                  required
                />
              </label>
            )}
            {error && (
              <small className="form-note" style={{ color: "#C94C4C" }}>
                {error}
              </small>
            )}
            {reg && (
              <small className="form-note">
                By continuing, you agree to our Terms and Privacy Policy.
              </small>
            )}
            <button className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? "Connecting…" : reg ? "Create account" : "Log in"}{" "}
              <ArrowRight size={16} />
            </button>
          </form>
          <div className="auth-switch">
            {reg ? "Already have an account?" : "New to Stockfolio?"}{" "}
            <Link to={reg ? "/login" : "/register"}>
              {reg ? "Log in" : "Create an account"}
            </Link>
          </div>
          <div className="demo-note">
            <Sparkles size={15} />
            <span>
              <b>Demo mode is ready.</b> Open the dashboard to explore
              illustrative data.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
function Shell({
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
function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading reveal">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function MarketHeadlines({ tickerRef }) {
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
function Dashboard({ d, notify }) {
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
                tick={{ fill: "#92968F", fontSize: 10 }}
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
                labelStyle={{ color: "#6B716C", fontSize: 9 }}
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
function WatchRows({ items, onRemove, empty }) {
  if (!items.length)
    return (
      empty || <div className="timeline-empty">Your watchlist is empty.</div>
    );
  return (
    <div className="watch-rows">
      {items.map((h, i) => (
        <div className="watch-line" key={h.symbol}>
          <Link to={"/stocks/" + h.symbol} className="watch-line-main">
            <span className="watch-rank">0{i + 1}</span>
            <StockAvatar symbol={h.symbol} />
            <span className="watch-name">
              <b>{h.symbol}</b>
              <small>{h.name}</small>
            </span>
            <Sparkline symbol={h.symbol} change={h.change || 0} />
            <strong>{money(h.price, 2)}</strong>
            <span className={h.change >= 0 ? "positive" : "negative"}>
              {h.change >= 0 ? "+" : ""}
              {Number(h.change || 0).toFixed(2)}%
            </span>
          </Link>
          {onRemove && (
            <button
              className="watch-remove"
              onClick={() => onRemove(h.symbol)}
              aria-label={`Remove ${h.symbol} from watchlist`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
function ActivityTimeline({ tx }) {
  return (
    <div className="editorial-timeline">
      {tx.map((item, i) => (
        <div className="timeline-item" key={item.id}>
          <span className="timeline-node" />
          <time>
            {i === 0
              ? "TODAY"
              : new Date(item.time)
                  .toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })
                  .toUpperCase()}
            <small>
              {new Date(item.time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </time>
          <div>
            <b>
              {item.type === "BUY" ? "Bought" : "Sold"} {item.qty} {item.symbol}
            </b>
            <small>{item.name}</small>
          </div>
          <strong>
            {item.type === "BUY" ? "−" : "+"}
            {money(item.total, 2)}
          </strong>
        </div>
      ))}
    </div>
  );
}
function Sparkline({ symbol, change = 0 }) {
  const seedValue = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
  const vals = Array.from(
    { length: 9 },
    (_, i) =>
      30 +
      Math.sin(i * 0.9 + seedValue) * 6 +
      Math.cos(i * 0.43 + seedValue) * 4 +
      (change / 4) * i,
  );
  const min = Math.min(...vals),
    max = Math.max(...vals);
  const pts = vals
    .map((v, i) => `${i * 10},${23 - ((v - min) / (max - min || 1)) * 19}`)
    .join(" ");
  return (
    <svg
      className="sparkline-svg"
      viewBox="0 0 80 25"
      aria-label={`Illustrative ${symbol} price trend`}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={change >= 0 ? "#238B5D" : "#C94C4C"}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
function Stat({ title, value, note, icon: Icon, accent, positive }) {
  return (
    <div className={cx("stat-card", accent && "stat-accent")}>
      <div className="stat-label">
        {title}
        <span className="stat-icon">
          <Icon size={16} />
        </span>
      </div>
      <b className="stat-value">{value}</b>
      <small className={positive ? "positive" : ""}>{note}</small>
    </div>
  );
}
function StockAvatar({ symbol }) {
  return (
    <span className={"stock-avatar av-" + symbol}>{symbol.slice(0, 1)}</span>
  );
}
function Holdings({ holdings }) {
  const listRef = useRef(null);
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !listRef.current
    )
      return;
    const ctx = gsap.context(
      () =>
        gsap.fromTo(
          ".holding-row",
          { opacity: 0, x: -8 },
          {
            opacity: 1,
            x: 0,
            duration: 0.42,
            stagger: 0.055,
            ease: "power2.out",
            scrollTrigger: {
              trigger: listRef.current,
              start: "top 92%",
              once: true,
            },
          },
        ),
      listRef,
    );
    return () => ctx.revert();
  }, [holdings.length]);
  return (
    <div className="holding-list" ref={listRef}>
      {holdings.map((h, i) => {
        const pl = (h.price - h.avg) * h.qty,
          pct = (h.price / h.avg - 1) * 100;
        return (
          <Link
            to={"/stocks/" + h.symbol}
            className="holding-row"
            key={h.symbol}
            style={{ "--row-index": i }}
          >
            <span className="holding-avatar">
              <StockAvatar symbol={h.symbol} />
            </span>
            <span className="holding-company">
              <b>{h.symbol}</b>
              <small>{h.name}</small>
            </span>
            <span className="holding-quantity">
              <b>
                {h.qty} <small>shares</small>
              </b>
              <i>AVG {money(h.avg, 2)}</i>
            </span>
            <Sparkline symbol={h.symbol} change={pct} />
            <span className="holding-market">
              <b>{money(h.price, 2)}</b>
              <small>MARKET PRICE</small>
            </span>
            <span className="holding-return">
              <b className={pl >= 0 ? "positive" : "negative"}>
                {pl >= 0 ? "+" : "−"}
                {money(Math.abs(pl), 2)}
              </b>
              <small className={pct >= 0 ? "positive" : "negative"}>
                {pct >= 0 ? "+" : ""}
                {pct.toFixed(2)}%
              </small>
            </span>
            <ArrowRight className="holding-arrow" size={15} />
          </Link>
        );
      })}
      {!holdings.length && (
        <div className="empty-state">
          <BriefcaseBusiness size={23} />
          <b>Your portfolio is ready</b>
          <p>Explore markets and make a virtual trade to get started.</p>
          <Link className="btn btn-primary" to="/markets">
            Explore markets
          </Link>
        </div>
      )}
    </div>
  );
}
function TransactionsRows({ tx }) {
  return (
    <div className="transaction-list">
      {tx.map((t) => (
        <div className="transaction-row" key={t.id}>
          <span
            className={cx(
              "transaction-icon",
              t.type === "BUY" ? "buy-icon" : "sell-icon",
            )}
          >
            {t.type === "BUY" ? (
              <ArrowDownLeft size={15} />
            ) : (
              <ArrowUpRight size={15} />
            )}
          </span>
          <span className="transaction-company">
            <b>
              {t.type === "BUY" ? "Bought" : "Sold"} {t.symbol}
            </b>
            <small>
              {t.qty} shares · {new Date(t.time).toLocaleDateString()}
            </small>
          </span>
          <span className="transaction-amount">
            <b>
              {t.type === "BUY" ? "−" : "+"}
              {money(t.total)}
            </b>
            <small>{t.type === "BUY" ? "BUY" : "SELL"}</small>
          </span>
        </div>
      ))}
    </div>
  );
}
function Portfolio({ d }) {
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
function Allocation({ d }) {
  const data = Object.entries(
    d.holdings.reduce(
      (a, h) => ((a[h.sector] = (a[h.sector] || 0) + h.qty * h.price), a),
      {},
    ),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const colors = ["#426B4F", "#748578", "#9CA49B", "#B8B8AA", "#D0CEC3"];
  const total = data.reduce((a, x) => a + x.value, 0);
  return (
    <div className="allocation-bars">
      {data.map((a, i) => {
        const pct = total ? (a.value / total) * 100 : 0;
        return (
          <div
            className="allocation-bar-row"
            key={a.name}
            style={{ "--allocation-color": colors[i % colors.length] }}
          >
            <div className="allocation-meta">
              <span>
                <i />
                {a.name}
              </span>
              <b>{pct.toFixed(1)}%</b>
            </div>
            <div className="allocation-track">
              <span style={{ width: `${pct}%` }} />
            </div>
            <small>{money(a.value, 2)} market value</small>
          </div>
        );
      })}
      {!data.length && (
        <div className="timeline-empty">
          Allocation appears when you add holdings.
        </div>
      )}
    </div>
  );
}
function SearchBox({
  query,
  setQuery,
  placeholder = "Search stocks, companies…",
}) {
  return (
    <div className="stock-search">
      <Search size={16} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      {query && (
        <button onClick={() => setQuery("")}>
          <X size={15} />
        </button>
      )}
      <kbd>/</kbd>
    </div>
  );
}
const marketStocks = [
  ...seed,
  {
    symbol: "SBIN",
    name: "State Bank of India",
    sector: "Financial Services",
    price: 800,
    change: -0.18,
    qty: 0,
    avg: 800,
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel Limited",
    sector: "Telecommunication",
    price: 1750,
    change: 0.73,
    qty: 0,
    avg: 1750,
  },
  {
    symbol: "ITC",
    name: "ITC Limited",
    sector: "Consumer Goods",
    price: 430,
    change: 0.21,
    qty: 0,
    avg: 430,
  },
  {
    symbol: "LT",
    name: "Larsen & Toubro Limited",
    sector: "Industrials",
    price: 3600,
    change: -0.15,
    qty: 0,
    avg: 3600,
  },
  {
    symbol: "MARUTI",
    name: "Maruti Suzuki India Limited",
    sector: "Automobile",
    price: 12500,
    change: 0.38,
    qty: 0,
    avg: 12500,
  },
];
function Markets({ query, setQuery, watch, setWatch, notify }) {
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
function Watchlist({ d, query, setQuery, notify }) {
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
function Transactions({ tx }) {
  const [type, setType] = useState("All activity"),
    [search, setSearch] = useState("");
  const filtered = tx.filter(
    (t) =>
      (type === "All activity" || t.type === type) &&
      `${t.symbol} ${t.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="THE PAPER TRAIL"
        title="Activity."
        description="Every virtual trade, neatly accounted for."
      />
      <div className="market-toolbar">
        <SearchBox
          query={search}
          setQuery={setSearch}
          placeholder="Search activity…"
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>All activity</option>
          <option>BUY</option>
          <option>SELL</option>
        </select>
      </div>
      <section className="activity-ledger">
        <div className="activity-ledger-head">
          <div>
            <div className="eyebrow">TRANSACTION HISTORY</div>
            <h2>
              {filtered.length} recorded{" "}
              {filtered.length === 1 ? "move" : "moves"}
            </h2>
          </div>
          <span>VIRTUAL ACCOUNT</span>
        </div>
        {filtered.length ? (
          <ActivityTimeline tx={filtered} />
        ) : (
          <div className="empty-state">
            <Clock3 size={24} />
            <b>No activity yet</b>
            <p>Your virtual trades will be recorded here.</p>
            <Link to="/markets" className="btn btn-primary">
              Explore markets
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
function StockPage({ d, notify }) {
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
                  tick={{ fill: "#92968F", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.ceil(history.length / 6) - 1)}
                />
                <YAxis
                  orientation="right"
                  tick={{ fill: "#92968F", fontSize: 10 }}
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
function TradeModal({
  stock,
  owned = 0,
  initialType = "BUY",
  onClose,
  onTrade,
}) {
  const [type, setType] = useState(initialType),
    [qty, setQty] = useState("1");
  const n = Math.max(1, Number(qty) || 1);
  useEffect((e) => {
    function key(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="trade-modal">
        <div className="modal-head">
          <div>
            <div className="eyebrow">VIRTUAL ORDER</div>
            <h2>{type === "BUY" ? "Buy shares" : "Sell shares"}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="trade-stock">
          <StockAvatar symbol={stock.symbol} />
          <span>
            <b>{stock.name}</b>
            <small>
              {stock.symbol} · {money(stock.price, 2)} per share
            </small>
          </span>
        </div>
        <div className="trade-tabs">
          <button
            className={type === "BUY" ? "buy-selected" : ""}
            onClick={() => setType("BUY")}
          >
            Buy
          </button>
          <button
            className={type === "SELL" ? "sell-selected" : ""}
            onClick={() => setType("SELL")}
          >
            Sell
          </button>
        </div>
        <label className="quantity-label">
          Quantity{" "}
          <span>
            {type === "SELL" ? `You own ${owned} shares` : "Whole shares only"}
          </span>
          <input
            type="number"
            min="1"
            max={type === "SELL" ? owned : undefined}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </label>
        <div className="estimate-row">
          <span>Estimated {type === "BUY" ? "cost" : "proceeds"}</span>
          <b>{money(n * stock.price, 2)}</b>
        </div>
        <div className="virtual-note">
          <ShieldCheck size={15} /> This is a virtual trade. No real money is
          involved.
        </div>
        <button
          className={cx(
            "btn",
            "trade-confirm",
            type === "BUY" ? "btn-primary" : "btn-sell",
          )}
          onClick={() => onTrade(type, n)}
          disabled={type === "SELL" && !owned}
        >
          {type === "BUY" ? "Confirm buy" : "Confirm sell"}{" "}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
function GlobalSearch({ close }) {
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
  }, []);
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
function SettingsPage({ user, cash }) {
  return (
    <>
      <PageHeading
        eyebrow="YOUR ACCOUNT"
        title="Settings."
        description="A few details about your Stockfolio workspace."
      />
      <div className="settings-grid">
        <section className="panel settings-card">
          <div className="eyebrow">PROFILE</div>
          <h2>Personal details</h2>
          <div className="profile-line">
            <span className="user-avatar large-avatar">
              {(user || "A")[0].toUpperCase()}
            </span>
            <span>
              <b>{user}</b>
              <small>Personal account</small>
            </span>
          </div>
          <div className="setting-row">
            <span>
              <b>Account type</b>
              <small>Virtual investing workspace</small>
            </span>
            <span className="sector-pill">Virtual</span>
          </div>
          <div className="setting-row">
            <span>
              <b>Market data</b>
              <small>Provider status appears in the header</small>
            </span>
            <span className="positive">Server</span>
          </div>
        </section>
        <section className="panel settings-card">
          <div className="eyebrow">YOUR VIRTUAL ACCOUNT</div>
          <h2>Account balance</h2>
          <div className="balance-display">{money(cash, 2)}</div>
          <p className="settings-explain">
            Your cash balance is used for virtual stock trades. No real money is
            deposited or withdrawn.
          </p>
          <div className="virtual-note">
            <ShieldCheck size={15} /> This account does not connect to a
            brokerage.
          </div>
        </section>
      </div>
    </>
  );
}
export default App;

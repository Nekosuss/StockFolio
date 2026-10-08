import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  Compass,
  Eye,
  Globe2,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import gsap from "gsap";
import { BrandMark } from "../components/common/BrandMark.jsx";
import { Feature } from "../components/common/Feature.jsx";
import { chartData } from "../constants/data.js";

export function Landing() {
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

export default Landing;

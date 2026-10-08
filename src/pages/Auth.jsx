import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import axios from "axios";
import { BrandMark } from "../components/common/BrandMark.jsx";

export function Auth({ mode, setUser }) {
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

export default Auth;

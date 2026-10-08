import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import gsap from "gsap";
import { StockAvatar } from "../common/StockAvatar.jsx";
import { Sparkline } from "../common/Sparkline.jsx";
import { money } from "../../utils/formatters.js";

export function Holdings({ holdings }) {
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

export default Holdings;

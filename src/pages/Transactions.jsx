import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Clock3 } from "lucide-react";
import { PageHeading } from "../components/layout/PageHeading.jsx";
import { SearchBox } from "../components/common/SearchBox.jsx";
import { ActivityTimeline } from "../components/dashboard/ActivityTimeline.jsx";

export function Transactions({ tx }) {
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

export default Transactions;

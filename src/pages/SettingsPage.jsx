import React from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeading } from "../components/layout/PageHeading.jsx";
import { money } from "../utils/formatters.js";

export function SettingsPage({ user, cash }) {
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

export default SettingsPage;

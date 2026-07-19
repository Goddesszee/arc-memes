import { useState } from "react";
import { Link } from "react-router-dom";
import { useMemes } from "../lib/useMemes";
import TickerTape from "../components/TickerTape";
import TokenRow from "../components/TokenRow";
import "./Explore.css";

const TABS = [
  { key: "trending", label: "Trending", empty: "Nothing trending yet" },
  { key: "new", label: "New", empty: "No memes launched yet" },
  { key: "topMarketCap", label: "Top market cap", empty: "Nothing to rank yet" },
  { key: "graduated", label: "Graduated", empty: "None have graduated yet" },
];

export default function Explore() {
  const { memes, categories, loading, error } = useMemes();
  const [tab, setTab] = useState("trending");

  const tickerData = memes.slice(0, 12).map((m, i) => ({
    symbol: m.symbol,
    up: i % 2 === 0,
    changeLabel: m.priceUsdc ? `$${m.priceUsdc.toFixed(6)}` : "—",
  }));

  const activeTab = TABS.find((t) => t.key === tab);
  const activeList = (categories[tab] || []).slice(0, 8);

  return (
    <div className="explore">
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <span className="hero__eyebrow">Live on Arc testnet</span>
        <h1>
          Every meme starts<br />as a <span className="hero__accent">curve.</span>
        </h1>
        <p className="hero__sub">
          Launch a token for your meme in one transaction. No liquidity to seed —
          the bonding curve prices it from the first buy.
        </p>
        <div className="hero__cta">
          <Link to="/launch" className="btn btn--primary">Launch a meme</Link>
          <a href="#grid" className="btn btn--ghost">See what's trading</a>
        </div>
      </section>

      <TickerTape memes={tickerData} />

      <section className="discover-section">
        <div className="discover-section__tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? "active" : ""}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="state-msg">Loading…</p>}
        {!loading && !error && activeList.length === 0 && (
          <p className="state-msg">{activeTab.empty}</p>
        )}
        {!loading && activeList.length > 0 && (
          <div className="discover-section__list">
            {activeList.map((m, i) => (
              <TokenRow meme={m} key={m.token} rank={i + 1} />
            ))}
          </div>
        )}
      </section>

      <section id="grid" className="grid-section">
        <div className="grid-section__header">
          <h2>Live on the curve</h2>
          <span className="grid-section__count">{memes.length} launched</span>
        </div>

        {loading && (
          <div className="meme-grid">
            {Array.from({ length: 6 }).map((_, i) => <div className="meme-card meme-card--skeleton" key={i} />)}
          </div>
        )}

        {!loading && error === "not-configured" && (
          <div className="empty-state">
            <div className="empty-state__mark">◇</div>
            <p>Contracts aren't deployed yet.</p>
            <span>Once the MemeFactory address is set, launched memes will show up here automatically.</span>
          </div>
        )}

        {!loading && error && error !== "not-configured" && (
          <div className="empty-state empty-state--error">
            <div className="empty-state__mark">!</div>
            <p>Couldn't load memes</p>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && memes.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__mark">◇</div>
            <p>No memes launched yet</p>
            <span>Be the first — it takes about a minute.</span>
            <Link to="/launch" className="btn btn--primary" style={{ marginTop: 20 }}>Launch a meme</Link>
          </div>
        )}

        {!loading && memes.length > 0 && (
          <div className="meme-grid">
            {memes.map((m) => (
              <Link to={`/meme/${m.token}`} key={m.token} className="meme-card">
                <div className="meme-card__image">
                  {m.imageURI ? <img src={m.imageURI} alt={m.name} loading="lazy" /> : <div className="meme-card__placeholder">${m.symbol}</div>}
                </div>
                <div className="meme-card__body">
                  <span className="meme-card__name">{m.name}</span>
                  <span className="meme-card__symbol">${m.symbol}</span>
                  <span className="meme-card__price">
                    {m.priceUsdc ? `$${m.priceUsdc.toFixed(6)}` : "pre-launch"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

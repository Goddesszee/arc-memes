import { Link } from "react-router-dom";
import { useMemes } from "../lib/useMemes";
import TickerTape from "../components/TickerTape";
import "./Explore.css";

export default function Explore() {
  const { memes, loading, error } = useMemes();

  const tickerData = memes.slice(0, 12).map((m, i) => ({
    symbol: m.symbol,
    up: i % 2 === 0,
    changeLabel: m.priceUsdc ? `$${m.priceUsdc.toFixed(6)}` : "—",
  }));

  return (
    <div className="explore">
      <section className="hero">
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

      <section id="grid" className="grid-section">
        <div className="grid-section__header">
          <h2>Live on the curve</h2>
          <span className="grid-section__count">{memes.length} launched</span>
        </div>

        {loading && <p className="state-msg">Loading memes…</p>}

        {!loading && error === "not-configured" && (
          <p className="state-msg">
            Contracts aren't deployed yet — once the MemeFactory address is set,
            launched memes will show up here automatically.
          </p>
        )}

        {!loading && error && error !== "not-configured" && (
          <p className="state-msg state-msg--error">Couldn't load memes: {error}</p>
        )}

        {!loading && !error && memes.length === 0 && (
          <p className="state-msg">No memes launched yet. Be the first — it takes about a minute.</p>
        )}

        <div className="meme-grid">
          {memes.map((m) => (
            <Link to={`/meme/${m.token}`} key={m.token} className="meme-card">
              <div className="meme-card__image">
                {m.imageURI ? <img src={m.imageURI} alt={m.name} /> : <div className="meme-card__placeholder">${m.symbol}</div>}
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
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useMemes } from "../lib/MemesContext";
import "./TopTicker.css";

function fmtPrice(n) {
  if (!n) return "—";
  if (n < 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(4)}`;
}

function timeAgo(unixSeconds) {
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TopTicker() {
  const { categories, loading } = useMemes();
  const list = categories.new?.slice(0, 10) || [];

  if (loading || list.length === 0) return null;

  const row = [...list, ...list]; // duplicate for seamless loop

  return (
    <div className="top-ticker">
      <div className="top-ticker__track">
        {row.map((m, i) => (
          <Link to={`/meme/${m.token}`} className="top-ticker__item" key={`${m.token}-${i}`}>
            <span className="top-ticker__thumb">
              {m.imageURI ? <img src={m.imageURI} alt="" /> : m.symbol[0]}
            </span>
            <span className="top-ticker__symbol">{m.symbol}</span>
            <span className="top-ticker__price">{fmtPrice(m.priceUsdc)}</span>
            <span className="top-ticker__time">{timeAgo(m.launchedAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

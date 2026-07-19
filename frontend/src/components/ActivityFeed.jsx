import { useTradeHistory } from "../lib/useTradeHistory";
import { explorerTxUrl } from "../lib/config";
import "./ActivityFeed.css";

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

function timeAgo(unixSeconds) {
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtToken(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

export default function ActivityFeed({ curveAddress, symbol }) {
  const { trades, loading, error } = useTradeHistory(curveAddress);
  const recent = [...trades].reverse().slice(0, 20); // newest first

  if (loading) return <p className="activity-feed__empty">Loading activity…</p>;
  if (error) return <p className="activity-feed__empty">Couldn't load activity.</p>;
  if (recent.length === 0) return <p className="activity-feed__empty">No trades yet. Be the first.</p>;

  return (
    <div className="activity-feed">
      {recent.map((t, i) => (
        <a
          href={explorerTxUrl(t.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className={`activity-row activity-row--${t.type}`}
          key={`${t.txHash}-${i}`}
        >
          <span className={`activity-row__badge activity-row__badge--${t.type}`}>
            {t.type === "buy" ? "Bought" : "Sold"}
          </span>
          <span className="activity-row__trader">{shortAddr(t.trader)}</span>
          <span className="activity-row__amount">
            {fmtToken(t.tokenAmount)} ${symbol}
          </span>
          <span className="activity-row__time">{timeAgo(t.timestamp)}</span>
        </a>
      ))}
    </div>
  );
}

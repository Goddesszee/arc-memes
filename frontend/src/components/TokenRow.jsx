import { Link } from "react-router-dom";
import "./TokenRow.css";

function fmtUsd(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n === 0) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(2)}`;
}

export default function TokenRow({ meme, onClick, rank, variant }) {
  return (
    <Link to={`/meme/${meme.token}`} className="token-row" onClick={onClick}>
      {rank && <span className="token-row__rank">{rank}</span>}
      <div className="token-row__thumb">
        {meme.imageURI ? <img src={meme.imageURI} alt="" /> : <span>${meme.symbol[0]}</span>}
      </div>
      <div className="token-row__info">
        <span className="token-row__name">
          {meme.name}
          {meme.graduated && <span className="token-row__badge token-row__badge--grad" title="Graduated">🎓</span>}
        </span>
        <span className="token-row__symbol">${meme.symbol}</span>
      </div>
      {variant === "bonding" ? (
        <div className="token-row__stats">
          <span className="token-row__mcap">{Math.round((meme.bondingProgress || 0) * 100)}%</span>
          <span className="token-row__label">to graduate</span>
        </div>
      ) : variant === "volume" ? (
        <div className="token-row__stats">
          <span className="token-row__mcap">{fmtUsd(meme.volume24h || 0)}</span>
          <span className="token-row__label">24h vol</span>
        </div>
      ) : (
        <div className="token-row__stats">
          <span className="token-row__mcap">{fmtUsd(meme.marketCapUsdc || 0)}</span>
          <span className="token-row__label">mkt cap</span>
        </div>
      )}
    </Link>
  );
}

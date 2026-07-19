import { Link, NavLink } from "react-router-dom";
import { useWallet } from "../lib/WalletContext";
import "./NavBar.css";

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function NavBar() {
  const { address, connecting, error, connect } = useWallet();

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <svg className="navbar__mark" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M6 24 Q16 6 26 24" stroke="#9B82FF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="26" cy="24" r="2.4" fill="#39FF88" />
        </svg>
        Arc Memes
      </Link>

      <nav className="navbar__links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Explore</NavLink>
        <NavLink to="/launch" className={({ isActive }) => isActive ? "active" : ""}>Launch a meme</NavLink>
      </nav>

      <div className="navbar__wallet">
        {error && <span className="navbar__error" title={error}>Connection failed</span>}
        {address ? (
          <span className="navbar__address">{shortAddr(address)}</span>
        ) : (
          <button className="navbar__connect" onClick={connect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </header>
  );
}

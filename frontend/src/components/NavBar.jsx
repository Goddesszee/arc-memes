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
        <span className="navbar__mark">▲</span>
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

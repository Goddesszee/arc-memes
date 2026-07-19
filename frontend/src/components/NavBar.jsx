import { useState, useRef, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useWallet } from "../lib/WalletContext";
import { explorerAddressUrl } from "../lib/config";
import ThemeToggle from "./ThemeToggle";
import DiscoverMenu from "./DiscoverMenu";
import "./NavBar.css";

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function NavBar() {
  const { address, connecting, error, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <svg className="navbar__mark" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M6 24 Q16 6 26 24" stroke="#00E5D0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="26" cy="24" r="2.4" fill="#FF3EA5" />
        </svg>
        Arc Memes
      </Link>

      <nav className="navbar__links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Explore</NavLink>
        <DiscoverMenu />
        <NavLink to="/launch" className={({ isActive }) => isActive ? "active" : ""}>Launch a meme</NavLink>
      </nav>

      <div className="navbar__actions">
        <ThemeToggle />

        {error && <span className="navbar__error" title={error}>Connection failed</span>}

        {address ? (
          <div className="wallet-menu" ref={menuRef}>
            <button className="navbar__address" onClick={() => setMenuOpen((v) => !v)}>
              <span className="navbar__dot" />
              {shortAddr(address)}
            </button>
            {menuOpen && (
              <div className="wallet-menu__dropdown">
                <Link to={`/profile/${address}`} onClick={() => setMenuOpen(false)}>My profile</Link>
                <button onClick={copyAddress}>{copied ? "Copied ✓" : "Copy address"}</button>
                <a href={explorerAddressUrl(address)} target="_blank" rel="noopener noreferrer">
                  View on Explorer ↗
                </a>
                <button className="wallet-menu__disconnect" onClick={() => { disconnect(); setMenuOpen(false); }}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="navbar__connect" onClick={connect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </header>
  );
}

import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useWallet } from "../lib/WalletContext";
import { explorerAddressUrl } from "../lib/config";
import ThemeToggle from "./ThemeToggle";
import DiscoverMenu from "./DiscoverMenu";
import SearchBar from "./SearchBar";
import "./NavBar.css";

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export default function NavBar() {
  const { address, connecting, error, connect, disconnect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Close the mobile nav panel whenever the route changes
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <header className="navbar">
      <div className="navbar__row">
        <button
          className="navbar__hamburger"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          )}
        </button>

        <Link to="/" className="navbar__brand">
          <svg className="navbar__mark" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M6 24 Q16 6 26 24" stroke="#3D7BFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="26" cy="24" r="2.4" fill="#0B0F19" />
          </svg>
          Arc Memes
        </Link>

        <nav className="navbar__links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Explore</NavLink>
          <DiscoverMenu />
          <NavLink to="/swap" className={({ isActive }) => isActive ? "active" : ""}>Swap</NavLink>
          <NavLink to="/launch" className={({ isActive }) => isActive ? "active" : ""}>Launch a meme</NavLink>
        </nav>

        <div className="navbar__search">
          <SearchBar />
        </div>

        <div className="navbar__actions">
          <ThemeToggle />

          {error && <span className="navbar__error" title={error}>Connection failed</span>}

          {address ? (
            <div className="wallet-menu" ref={menuRef}>
              <button className="navbar__address" onClick={() => setMenuOpen((v) => !v)}>
                <span className="navbar__dot" />
                <span className="navbar__address-text">{shortAddr(address)}</span>
              </button>
              {menuOpen && (
                <div className="wallet-menu__dropdown">
                  <Link to={`/profile/${address}`} onClick={() => setMenuOpen(false)}>My profile</Link>
                  <Link to="/send" onClick={() => setMenuOpen(false)}>Send</Link>
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
              {connecting ? "Connecting…" : "Connect"}
            </button>
          )}
        </div>
      </div>

      {mobileNavOpen && (
        <nav className="navbar__mobile-panel">
          <div className="navbar__mobile-search">
            <SearchBar onNavigate={() => setMobileNavOpen(false)} />
          </div>
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Explore</NavLink>
          <div className="navbar__mobile-discover">
            <DiscoverMenu />
          </div>
          <NavLink to="/swap" className={({ isActive }) => isActive ? "active" : ""}>Swap</NavLink>
          <NavLink to="/launch" className={({ isActive }) => isActive ? "active" : ""}>Launch a meme</NavLink>
        </nav>
      )}
    </header>
  );
}

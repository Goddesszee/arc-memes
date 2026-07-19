import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMemes } from "../lib/MemesContext";
import "./SearchBar.css";

export default function SearchBar({ onNavigate }) {
  const { memes } = useMemes();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return memes
      .filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.symbol.toLowerCase().includes(q) ||
        m.token.toLowerCase().includes(q) ||
        m.curve.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [memes, query]);

  function goTo(token) {
    setQuery("");
    setOpen(false);
    onNavigate?.();
    navigate(`/meme/${token}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (results.length > 0) goTo(results[0].token);
  }

  return (
    <div className="search-bar" ref={wrapRef}>
      <form onSubmit={handleSubmit}>
        <svg className="search-bar__icon" width="15" height="15" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M17 17l-3.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search name, symbol, or address"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </form>

      {open && query.trim() && (
        <div className="search-bar__results">
          {results.length === 0 ? (
            <p className="search-bar__empty">No matches for "{query}"</p>
          ) : (
            results.map((m) => (
              <button type="button" className="search-bar__result" key={m.token} onClick={() => goTo(m.token)}>
                <span className="search-bar__thumb">
                  {m.imageURI ? <img src={m.imageURI} alt="" /> : m.symbol[0]}
                </span>
                <span className="search-bar__result-info">
                  <span className="search-bar__result-name">{m.name}</span>
                  <span className="search-bar__result-symbol">${m.symbol}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

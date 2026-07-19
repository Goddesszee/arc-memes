import { useState, useRef, useEffect } from "react";
import { useMemes } from "../lib/MemesContext";
import TokenRow from "./TokenRow";
import "./DiscoverMenu.css";

const TABS = [
  { key: "trending", label: "Hot" },
  { key: "bondingSoon", label: "Bonding" },
  { key: "new", label: "New" },
  { key: "topMarketCap", label: "Top mkt cap" },
  { key: "graduated", label: "Graduated" },
];

export default function DiscoverMenu() {
  const { categories, loading } = useMemes();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("trending");
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const list = (categories[tab] || []).slice(0, 5);

  return (
    <div className="discover-menu" ref={ref}>
      <button className="discover-menu__trigger" onClick={() => setOpen((v) => !v)}>
        Discover
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="discover-menu__panel">
          <div className="discover-menu__tabs">
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

          <div className="discover-menu__list">
            {loading && <p className="discover-menu__empty">Loading…</p>}
            {!loading && list.length === 0 && (
              <p className="discover-menu__empty">
                {tab === "graduated" ? "None graduated yet" : "Nothing here yet"}
              </p>
            )}
            {!loading && list.map((m, i) => (
              <TokenRow meme={m} key={m.token} rank={i + 1} onClick={() => setOpen(false)} variant={tab === "bondingSoon" ? "bonding" : tab === "trending" ? "volume" : undefined} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

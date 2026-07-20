import { useState } from "react";
import "./CopyChip.css";

export default function CopyChip({ label, value, display }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className="copy-chip" onClick={handleCopy} title={value}>
      {label && <span className="copy-chip__label">{label}</span>}
      <span className="copy-chip__value">{display || value}</span>
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" className="copy-chip__icon">
        {copied ? (
          <path d="M4 10l4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 13V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.5" />
          </>
        )}
      </svg>
    </button>
  );
}

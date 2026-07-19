import { useState } from "react";
import { shareOrDownload } from "../lib/shareCard";
import { useToast } from "../lib/ToastContext";
import "./ShareButton.css";

export default function ShareButton({ meme, priceUsdc }) {
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  async function handleClick() {
    setBusy(true);
    try {
      const result = await shareOrDownload(meme, priceUsdc);
      if (result === "downloaded") {
        push({ title: "Card downloaded", message: "Ready to post", variant: "success" });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        push({ title: "Couldn't create share card", message: err.message, variant: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="share-btn" onClick={handleClick} disabled={busy}>
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
        <path d="M14 6a2.5 2.5 0 1 0-2.45-3H11.5L6.68 5.6A2.5 2.5 0 0 0 3.5 8.5a2.5 2.5 0 0 0 3.18 2.9l4.82 2.6h.05A2.5 2.5 0 1 0 14 12a2.48 2.48 0 0 0-1.32.38L7.86 9.79M7.86 8.21l4.82-2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {busy ? "Generating…" : "Share card"}
    </button>
  );
}

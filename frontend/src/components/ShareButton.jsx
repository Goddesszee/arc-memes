import { useReceipt } from "../lib/ReceiptContext";
import "./ShareButton.css";

export default function ShareButton({ meme, priceUsdc }) {
  const { openReceipt } = useReceipt();

  function handleClick() {
    openReceipt({ type: "showcase", meme, priceUsdc, timestamp: Date.now() });
  }

  return (
    <button type="button" className="share-btn" onClick={handleClick}>
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
        <path d="M14 6a2.5 2.5 0 1 0-2.45-3H11.5L6.68 5.6A2.5 2.5 0 0 0 3.5 8.5a2.5 2.5 0 0 0 3.18 2.9l4.82 2.6h.05A2.5 2.5 0 1 0 14 12a2.48 2.48 0 0 0-1.32.38L7.86 9.79M7.86 8.21l4.82-2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Share card
    </button>
  );
}

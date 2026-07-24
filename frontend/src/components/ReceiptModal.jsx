import { useState } from "react";
import { useToast } from "../lib/ToastContext";
import "./ReceiptModal.css";

export default function ReceiptModal({ state, onClose }) {
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  if (!state.open) return null;

  const { loading, dataUrl, canvas, config, error } = state;
  const filename = `arcmemes-${config?.meme?.symbol || "receipt"}-${config?.type || "trade"}.png`;

  async function handleDownload() {
    if (!canvas) return;
    setBusy(true);
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image could not be exported");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      push({ title: "Downloaded", variant: "success" });
    } catch {
      push({ title: "Download failed", message: "Long press or right click the image below to save it instead.", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (!canvas) return;
    setBusy(true);
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Image could not be exported");
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Memes on Arc" });
      } else {
        push({ title: "Sharing isn't supported here", message: "Use Download instead, or long press the image below.", variant: "error" });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        push({ title: "Share failed", message: "Try Download instead.", variant: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyLink() {
    if (!config?.meme?.token) return;
    const url = `${window.location.origin}/meme/${config.meme.token}`;
    await navigator.clipboard.writeText(url);
    push({ title: "Link copied", variant: "success" });
  }

  return (
    <div className="receipt-modal__backdrop" onClick={onClose}>
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="receipt-modal__close" onClick={onClose} aria-label="Close">×</button>

        <div className="receipt-modal__image-wrap">
          {loading && <p className="receipt-modal__status">Generating your receipt…</p>}
          {error && <p className="receipt-modal__status receipt-modal__status--error">{error}</p>}
          {dataUrl && <img src={dataUrl} alt="Receipt" className="receipt-modal__image" />}
        </div>

        {dataUrl && (
          <p className="receipt-modal__hint">
            Tip: press and hold (or right click) the image above to save it directly, if the buttons below don't work on your device.
          </p>
        )}

        <div className="receipt-modal__actions">
          <button type="button" className="btn btn--primary" onClick={handleDownload} disabled={!canvas || busy}>
            Download
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleShare} disabled={!canvas || busy}>
            Share
          </button>
          {config?.meme?.token && (
            <button type="button" className="btn btn--ghost" onClick={handleCopyLink}>
              Copy buy link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

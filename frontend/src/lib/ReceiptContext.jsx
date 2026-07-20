import { createContext, useContext, useState, useCallback } from "react";
import { buildReceiptCanvas } from "./receiptCard";
import ReceiptModal from "../components/ReceiptModal";

const ReceiptContext = createContext(null);

export function ReceiptProvider({ children }) {
  const [state, setState] = useState({ open: false, loading: false, dataUrl: null, canvas: null, config: null, error: null });

  const openReceipt = useCallback(async (config) => {
    setState({ open: true, loading: true, dataUrl: null, canvas: null, config, error: null });
    try {
      const canvas = await buildReceiptCanvas(config);
      const dataUrl = canvas.toDataURL("image/png");
      setState({ open: true, loading: false, dataUrl, canvas, config, error: null });
    } catch (err) {
      setState({ open: true, loading: false, dataUrl: null, canvas: null, config, error: err.message || "Couldn't generate receipt" });
    }
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return (
    <ReceiptContext.Provider value={{ openReceipt }}>
      {children}
      <ReceiptModal state={state} onClose={close} />
    </ReceiptContext.Provider>
  );
}

export function useReceipt() {
  const ctx = useContext(ReceiptContext);
  if (!ctx) throw new Error("useReceipt must be used within ReceiptProvider");
  return ctx;
}

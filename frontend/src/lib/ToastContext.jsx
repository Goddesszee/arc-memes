import { createContext, useContext, useState, useCallback } from "react";
import "../components/Toast.css";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = ++idCounter;
    setToasts((t) => [...t, { id, ...toast }]);
    setTimeout(() => dismiss(id), toast.duration || 8000);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastStack({ toasts, dismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div className={`toast toast--${t.variant || "info"}`} key={t.id}>
          <div className="toast__body">
            <span className="toast__title">{t.title}</span>
            {t.message && <span className="toast__message">{t.message}</span>}
          </div>
          <div className="toast__actions">
            {t.explorerUrl && (
              <a href={t.explorerUrl} target="_blank" rel="noopener noreferrer" className="toast__link">
                View on Explorer ↗
              </a>
            )}
            <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

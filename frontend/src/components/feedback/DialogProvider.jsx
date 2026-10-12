import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const DialogContext = createContext(null);

const ICONS = {
  success: "bi-check-lg",
  error: "bi-x-lg",
  danger: "bi-trash3",
  warning: "bi-exclamation-lg"
};

const SUCCESS_AUTO_CLOSE_MS = 2200;

function Dialog({ dialog, onClose }) {
  const { kind, tone, title, text, confirmText, cancelText, autoClose } = dialog;
  const isConfirm = kind === "confirm";
  const safeButton = useRef(null);

  // Escape cancels; focus starts on the safe choice (Cancel for confirms, OK for messages).
  useEffect(() => {
    safeButton.current?.focus();
    const onKey = (event) => { if (event.key === "Escape") onClose(!isConfirm); };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("dialog-open");
    return () => { document.removeEventListener("keydown", onKey); document.body.classList.remove("dialog-open"); };
  }, [isConfirm, onClose]);

  useEffect(() => {
    if (!autoClose) return undefined;
    const timer = setTimeout(() => onClose(true), autoClose);
    return () => clearTimeout(timer);
  }, [autoClose, onClose]);

  return (
    <div className="app-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose(!isConfirm)}>
      <div className={`app-dialog tone-${tone}`} role={isConfirm ? "alertdialog" : "dialog"} aria-modal="true" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-text">
        <div className="app-dialog-icon"><i className={`bi ${ICONS[tone] || ICONS.warning}`} /></div>
        <h3 id="app-dialog-title">{title}</h3>
        {text && <p id="app-dialog-text">{text}</p>}
        <div className="app-dialog-actions">
          {isConfirm ? (
            <>
              <button ref={safeButton} type="button" className="app-dialog-btn secondary" onClick={() => onClose(false)}>{cancelText}</button>
              <button type="button" className={`app-dialog-btn ${tone === "danger" ? "danger" : "primary"}`} onClick={() => onClose(true)}>{confirmText}</button>
            </>
          ) : (
            <button ref={safeButton} type="button" className={`app-dialog-btn ${tone === "success" ? "primary" : "secondary"}`} onClick={() => onClose(true)}>OK</button>
          )}
        </div>
        {autoClose && <div className="app-dialog-timer" style={{ animationDuration: `${autoClose}ms` }} />}
      </div>
    </div>
  );
}

// Wrap the app once; any component can then call useDialog().
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  }, []);

  const open = useCallback((options) => new Promise((resolve) => {
    resolver.current?.(false); // a newer dialog replaces an open one
    resolver.current = resolve;
    setDialog({ id: Date.now() + Math.random(), ...options });
  }), []);

  const api = useMemo(() => ({
    // Resolves true when the user confirms, false when they cancel.
    confirm: (options) => open({ kind: "confirm", tone: "danger", confirmText: "Delete", cancelText: "Cancel", ...options }),
    success: (title, text) => open({ kind: "alert", tone: "success", title, text, autoClose: SUCCESS_AUTO_CLOSE_MS }),
    error: (title, text) => open({ kind: "alert", tone: "error", title, text })
  }), [open]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog && <Dialog key={dialog.id} dialog={dialog} onClose={close} />}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used inside <DialogProvider>");
  return context;
}

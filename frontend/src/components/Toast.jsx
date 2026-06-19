import { createContext, useCallback, useContext, useState } from "react";
import { IconCheck, IconClose } from "./Icons.jsx";

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const value = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} onClick={() => remove(t.id)}>
            <span className="toast__icon">
              {t.type === "success" ? (
                <IconCheck width={14} height={14} />
              ) : (
                <IconClose width={14} height={14} />
              )}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

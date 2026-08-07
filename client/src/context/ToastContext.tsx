import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const variantStyles: Record<ToastVariant, string> = {
    success: 'border-l-4',
    error: 'border-l-4',
    info: 'border-l-4',
  };

  const variantColor: Record<ToastVariant, string> = {
    success: '#C6FF3D',
    error: '#FF4D4D',
    info: '#8B9198',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-viewport">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`card ${variantStyles[t.variant]} flex items-start justify-between gap-3 py-3`}
            style={{ borderLeftColor: variantColor[t.variant] }}
          >
            <p className="text-sm">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-xs opacity-60 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

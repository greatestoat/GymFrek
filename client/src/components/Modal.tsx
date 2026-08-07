import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
}

export default function Modal({ open, title, onClose, children, maxWidthClass = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`card w-full ${maxWidthClass} my-8`}>
        <div className="flex items-center justify-between mb-5">
          <h3 id="modal-title" className="font-display text-lg">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

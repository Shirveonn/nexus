import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Accessible dialog: closes on Escape or backdrop click, traps initial focus. */
export function Modal({ open, onClose, title, children, width = 440, className = "" }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} style={{ maxWidth: width }}>
        <button className="icon-button modal__close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        {children}
      </div>
    </div>,
    document.body
  );
}

/** Small "are you sure?" dialog. */
export function ConfirmDialog({ open, title, message, confirmLabel, danger, busy, onConfirm, onCancel }: {
  open: boolean; title: string; message: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width={400} className="confirm-dialog">
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="button-row confirm-dialog__actions">
        <button className="subtle-button" onClick={onCancel}>Cancel</button>
        <button className={danger ? "danger-button" : "solid-button"} onClick={onConfirm} disabled={busy}>
          {busy ? <span className="spinner" /> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

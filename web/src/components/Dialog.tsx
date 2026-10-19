import { useEffect, useRef, type ReactNode } from 'react';
import Button from './Button';

type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  /** Dialogs holding unsaved work can opt out of closing by clicking the backdrop. */
  closeOnBackdrop?: boolean;
};

/** Modal built on the native <dialog> element: focus is trapped, Esc closes it, and the page behind is inert. */
export default function Dialog({ open, title, onClose, children, wide = false, closeOnBackdrop = true }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  if (!open) return <dialog ref={ref} className="dialog" />;
  return (
    <dialog
      ref={ref}
      className={`dialog${wide ? ' dialog-wide' : ''}`}
      aria-labelledby="dialog-title"
      onClose={onClose}
      onCancel={e => {
        e.preventDefault();
        onClose();
      }}
      onMouseDown={e => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-body">
        <h2 id="dialog-title" className="dialog-title">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

type ConfirmProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, message, confirmLabel, destructive = false, busy = false, onConfirm, onCancel }: ConfirmProps) {
  return (
    <Dialog open={open} title={title} onClose={busy ? () => undefined : onCancel}>
      <p className="dialog-text">{message}</p>
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

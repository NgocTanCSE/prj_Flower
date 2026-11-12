'use client';

/**
 * ConfirmModal – hộp thoại xác nhận (xóa, chuyển trạng thái, ...).
 */

import React, { useEffect, useRef } from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
  title: string;
  message: string;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
  disableConfirm?: boolean;
}

export function ConfirmModal({
  title,
  message,
  open,
  onConfirm,
  onCancel,
  confirmLabel = 'Xác nhận',
  danger = false,
  disableConfirm = false,
}: ConfirmModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      {/* Focus trap: redirect */}
      <div
        ref={ref}
        className="relative w-full max-w-sm rounded-xl border border-[#e8e1e1] bg-white p-6 shadow-[0_24px_64px_rgba(92,58,64,0.24)]"
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-semibold text-[#1a1a1a]">{title}</h2>
        <p className="mt-2 text-sm text-[#5b5b5b]">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} disabled={disableConfirm} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

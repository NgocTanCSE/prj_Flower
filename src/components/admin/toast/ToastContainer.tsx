'use client'

/**
 * ToastContainer – renders toàn bộ thông báo hiện tại.
 * Được mount một lần trong `AdminLayout` (góc trên bên phải, z cao hơn modal).
 *
 * Hiệu ứng: hiện vào bằng fade + trượt ngang, tự động tắt sau 4.5 giây,
 * đóng thủ công bằng nút ✕. Có `role="status"` / `aria-live` cho screen
 * reader biết ngay khi có thông báo mới.
 */

import { useEffect } from 'react'

import { useToasts } from './toast'

const AUTO_DISMISS_MS = 4500

const ICONS: Record<import('./toast').ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
}

export function ToastContainer() {
  const { toasts, dismiss } = useToasts()

  useEffect(() => {
    if (toasts.length === 0) return
    // Chỉ đếm thời gian cho thông báo mới nhất (thông tin trên cùng).
    const newest = toasts[toasts.length - 1]
    const timer = window.setTimeout(() => dismiss(newest.id), AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [toasts, dismiss])

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed right-4 top-20 z-[60] flex flex-col gap-2 sm:right-6 sm:top-24 lg:right-8 lg:top-4"
      role="region"
      aria-label="Thông báo"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`
            pointer-events-auto flex w-80 items-start gap-2.5 rounded-xl border p-3 shadow-lg
            animate-toast-in
            ${toast.type === 'success' ? 'border-[#3f7f63] bg-[#e7f4ec] text-[#1f4d3a]' : ''}
            ${toast.type === 'error' ? 'border-[#cc3d3d] bg-[#fdecec] text-[#7a1d1d]' : ''}
            ${toast.type === 'info' ? 'border-[#4f7b9c] bg-[#eef2f7] text-[#23405e]' : ''}
          `}
        >
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
            aria-hidden="true"
          >
            {ICONS[toast.type]}
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Đóng thông báo"
            className="shrink-0 text-current opacity-60 transition-opacity hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

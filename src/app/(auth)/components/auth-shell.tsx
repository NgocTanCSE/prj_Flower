'use client'

import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import type { FormEvent, ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Form điều khiển client-side (thêm data vào form).
// ---------------------------------------------------------------------------

interface AuthFormProps {
  /** Các điều khiển (input/textarea/select) của form. */
  children: ReactNode
  /** Nhãn nút gửi form. */
  submitLabel: string
  /** Server Action nhận FormData. */
  action?: (formData: FormData) => void | Promise<void>
  /** Handler submit phía client (dùng cho form tự xử lý). */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
}

/** Nút submit đọc trạng thái pending của form cha. */
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white
        shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800
        disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Đang xử lý...' : label}
    </button>
  )
}

export function AuthForm({ children, submitLabel, action, onSubmit }: AuthFormProps) {
  return (
    <form className="flex flex-col gap-5" action={action} onSubmit={onSubmit}>
      <div className="flex flex-col gap-5">{children}</div>
      <SubmitButton label={submitLabel} />
    </form>
  )
}

interface AuthShellProps {
  /** Tiêu đề trang (h1). */
  title: string
  /** Dòng mô tả ngắn bên dưới tiêu đề. */
  description: string
  /** Nội dung form chính. */
  children: ReactNode
  /** Nút liên kết bên dưới (quên mật khẩu, đăng ký...). */
  footer?: ReactNode
  /** Liên kết quay lại (nếu có). */
  backTo?: string
}

export function AuthShell({ title, description, children, footer, backTo }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-4 sm:px-6">
      <div className="flex w-full max-w-sm flex-col rounded-2xl border border-primary-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-serif text-[1.875rem] font-bold leading-tight text-primary-900">{title}</h1>
          {description && <p className="mt-2 text-sm text-[#5b5b5b]">{description}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-5">{children}</div>

        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        {backTo && (
          <div className="mt-6 flex justify-center text-sm">
            <Link href={backTo} className="text-primary-600 transition-colors hover:text-primary-700">
              ← Quay lại
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

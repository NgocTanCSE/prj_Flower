'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { login } from '../actions'
import { AuthForm, AuthShell } from '../components/auth-shell'
import Link from 'next/link'

export default function Login() {
  const [state, formAction] = useFormState(login, { error: undefined, redirect: undefined })
  const router = useRouter()
  const { pending } = useFormStatus()

  // Thành công: supper quốc các quyền hạn -> điều hướng (cookie client-side đã được ghi).
  useEffect(() => {
    if (state?.redirect) router.replace(state.redirect)
  }, [state?.redirect, router])

  return (
    <AuthShell
      title="Đăng nhập"
      description="Vui lòng nhập email và mật khẩu tài khoản của bạn."
      footer={
        <div className="flex flex-col items-center gap-2 text-sm">
          <Link href="/register" className="text-primary-600 transition-colors hover:text-primary-700">
            Chưa có tài khoản? Đăng ký
          </Link>
          <Link href="/forgot-password" className="text-primary-600 transition-colors hover:text-primary-700">
            Quên mật khẩu?
          </Link>
        </div>
      }
    >
      <AuthForm submitLabel={pending ? 'Đang đăng nhập...' : 'Đăng nhập'}>
        <label htmlFor="login-email" className="block text-sm font-medium text-[#5b5b5b]">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="email@example.com"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-primary-300 px-4 py-3 text-sm text-wenge
            placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        <label htmlFor="login-password" className="block text-sm font-medium text-[#5b5b5b]">
          Mật khẩu
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          placeholder="••••••"
          required
          autoComplete="current-password"
          minLength={6}
          className="w-full rounded-xl border border-primary-300 px-4 py-3 text-sm text-wenge
            placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </AuthForm>

      {state?.error && (
        <p className="text-center text-sm font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </AuthShell>
  )
}

'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { login } from '@/app/(auth)/actions'
import { AuthForm, AuthShell } from '@/app/(auth)/components/auth-shell'

export default function AdminLogin() {
  const [state, formAction] = useFormState(login, { error: undefined, redirect: undefined })
  const router = useRouter()
  const { pending } = useFormStatus()

  useEffect(() => {
    if (state?.redirect) router.replace(state.redirect)
  }, [state?.redirect, router])

  return (
    <AuthShell
      title="Đăng nhập quản trị"
      description="Chỉ dành cho quản trị viên. Nhập mật khẩu để truy cập."
      footer={null}
    >
      <AuthForm submitLabel={pending ? 'Đang đăng nhập...' : 'Đăng nhập'}>
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
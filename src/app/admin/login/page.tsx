'use client'

import { useActionState } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { login } from '@/app/(auth)/actions'
import { AuthForm, AuthShell } from '@/app/(auth)/components/auth-shell'

export default function AdminLogin() {
  const [state, formAction] = useActionState(login, { error: undefined, redirect: undefined })
  const router = useRouter()

  useEffect(() => {
    if (state?.redirect) router.replace(state.redirect)
  }, [state?.redirect, router])

  return (
    <AuthShell
      title="Đăng nhập quản trị"
      description="Chỉ dành cho quản trị viên. Nhập mật khẩu để truy cập."
      footer={
        <Link href="/forgot-password" className="text-primary-600 transition-colors hover:text-primary-700">
          Quên mật khẩu?
        </Link>
      }
    >
      <AuthForm submitLabel="Đăng nhập" action={formAction}>
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

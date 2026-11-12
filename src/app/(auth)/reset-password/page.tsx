'use client'

import { Suspense, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'

import { resetPassword } from '../actions'
import { AuthForm, AuthShell } from '../components/auth-shell'
import { createBrowserAuthClient } from '@/lib/supabase/browser'
import Link from 'next/link'

/** Form đặt lại mật khẩu: đọc token từ magic link (search params) và gửi form. */
function ResetPasswordForm() {
  const search = useSearchParams()
  const router = useRouter()
  const [state, formAction] = useFormState(resetPassword, { error: undefined, redirect: undefined })
  const { pending } = useFormStatus()

  // Magic link của Supabase trả về trang này kèm `access_token` + `refresh_token`;
  // đặt session vào `document.cookie` để `server.ts` (SSR) đọc được.
  useEffect(() => {
    const access = search.get('access_token')
    const refresh = search.get('refresh_token')
    if (!access || !refresh) return

    // Client (browser) chỉ khởi tạo khi người dùng chuyển đến trang này.
    const supabase = createBrowserAuthClient()
    supabase.auth.setSession({ access_token: access, refresh_token: refresh }).then(({ error }) => {
      if (error) console.error('Lỗi đặt lại phiên:', error.message)
    })
  }, [search, router])

  useEffect(() => {
    if (state?.redirect) router.replace(state.redirect)
  }, [state?.redirect, router])

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Đường mật khôi phục được cho phép đặt mật khẩu mới."
      footer={
        <p className="text-sm text-[#5b5b5b]">
          Quay lại đăng nhập?{' '}
          <Link href="/login" className="text-primary-600 transition-colors hover:text-primary-700">
            Đăng nhập lại
          </Link>
        </p>
      }
    >
      <AuthForm submitLabel={pending ? 'Đang lưu...' : 'Lưu mật khẩu'}>
        <label htmlFor="reset-password" className="block text-sm font-medium text-[#5b5b5b]">
          Mật khẩu mới
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          placeholder="Ít nhất 6 ký tự"
          required
          autoComplete="new-password"
          minLength={6}
          className="w-full rounded-xl border border-primary-300 px-4 py-3 text-sm text-wenge
            placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        <label htmlFor="reset-password-confirm" className="block text-sm font-medium text-[#5b5b5b]">
          Xác nhận mật khẩu mới
        </label>
        <input
          id="reset-password-confirm"
          name="passwordConfirm"
          type="password"
          placeholder="Lặp lại mật khẩu mới"
          required
          autoComplete="new-password"
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

export default function ResetPassword() {
  // `useSearchParams()` phải nằm trong Suspense (bailout cho static export).
  return <Suspense>{<ResetPasswordForm />}</Suspense>
}

'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'

import { sendForgotPassword } from '../actions'
import { AuthForm, AuthShell } from '../components/auth-shell'
import Link from 'next/link'

export default function ForgotPassword() {
  const [state, formAction] = useFormState(sendForgotPassword, { error: undefined, redirect: undefined })
  const router = useRouter()
  const { pending } = useFormStatus()

  useEffect(() => {
    if (state?.redirect) router.replace(state.redirect)
  }, [state?.redirect, router])

  return (
    <AuthShell
      title="Quên mật khẩu"
      description="Nhập email bạn đã dùng để đăng ký, chúng tôi sẽ gửi đường mật khôi phục."
      footer={
        <p className="text-sm text-[#5b5b5b]">
          Nhớ mật khẩu?{' '}
          <Link href="/login" className="text-primary-600 transition-colors hover:text-primary-700">
            Quay lại đăng nhập
          </Link>
        </p>
      }
    >
      <AuthForm submitLabel={pending ? 'Đang gửi...' : 'Gửi đường mật'}>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-[#5b5b5b]">
          Email
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          placeholder="email@example.com"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-primary-300 px-4 py-3 text-sm text-wenge
            placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </AuthForm>

      {state?.error && (
        <p className="text-center text-sm font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {!state?.error && state?.sent && (
        <div className="text-center text-sm text-primary-700" role="alert">
          Đường mật khôi phục đã được gửi tới email của bạn.
        </div>
      )}
    </AuthShell>
  )
}

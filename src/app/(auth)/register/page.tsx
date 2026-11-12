'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { register } from '../actions'
import { AuthForm, AuthShell } from '../components/auth-shell'
import Link from 'next/link'

export default function Register() {
  const [state, formAction] = useFormState(register, { error: undefined, redirect: undefined })
  const router = useRouter()
  const { pending } = useFormStatus()

  useEffect(() => {
    if (state?.redirect) router.replace(state.redirect)
  }, [state?.redirect, router])

  return (
    <AuthShell
      title="Đăng ký tài khoản"
      description="Tạo tài khoản mới để đặt nhữngawai hoa tươi."
      footer={
        <p className="text-sm text-[#5b5b5b]">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-primary-600 transition-colors hover:text-primary-700">
            Đăng nhập
          </Link>
        </p>
      }
    >
      <AuthForm submitLabel={pending ? 'Đang tạo tài khoản...' : 'Đăng ký'}>
        <label htmlFor="register-email" className="block text-sm font-medium text-[#5b5b5b]">
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          placeholder="email@example.com"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-primary-300 px-4 py-3 text-sm text-wenge
            placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        <label htmlFor="register-password" className="block text-sm font-medium text-[#5b5b5b]">
          Mật khẩu
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          placeholder="Ít nhất 6 ký tự"
          required
          autoComplete="new-password"
          minLength={6}
          className="w-full rounded-xl border border-primary-300 px-4 py-3 text-sm text-wenge
            placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        <label htmlFor="register-confirm" className="block text-sm font-medium text-[#5b5b5b]">
          Xác nhận mật khẩu
        </label>
        <input
          id="register-confirm"
          name="passwordConfirm"
          type="password"
          placeholder="Lặp lại mật khẩu"
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

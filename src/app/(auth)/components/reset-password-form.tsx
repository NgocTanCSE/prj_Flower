'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState } from 'react-dom'

import { resetPassword } from '@/app/(auth)/actions'
import { AuthForm } from '@/app/(auth)/components/auth-shell'

export function ResetPasswordForm({ code }: { code: string }) {
  const [state, formAction] = useFormState(resetPassword, {})
  const router = useRouter()

  useEffect(() => {
    if (state?.redirect) router.replace(state.redirect)
  }, [state?.redirect, router])

  return (
    <>
      <AuthForm submitLabel="Cập nhật mật khẩu" action={formAction}>
        <input type="hidden" name="code" value={code} />

        <label htmlFor="reset-password" className="block text-sm font-medium text-[#5b5b5b]">
          Mật khẩu mới
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          placeholder="••••••"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-xl border border-primary-300 px-4 py-3 text-sm text-wenge
            placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        <label htmlFor="reset-password-confirm" className="block text-sm font-medium text-[#5b5b5b]">
          Xác nhận mật khẩu
        </label>
        <input
          id="reset-password-confirm"
          name="passwordConfirm"
          type="password"
          placeholder="••••••"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-xl border border-primary-300 px-4 py-3 text-sm text-wenge
            placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </AuthForm>

      {state?.error && (
        <p className="mt-4 text-center text-sm font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </>
  )
}
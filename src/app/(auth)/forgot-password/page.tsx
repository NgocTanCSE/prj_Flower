'use client'

import { useFormState } from 'react-dom'
import Link from 'next/link'

import { sendResetPassword } from '@/app/(auth)/actions'
import { AuthForm, AuthShell } from '@/app/(auth)/components/auth-shell'

export default function ForgotPassword() {
  const [state, formAction] = useFormState(sendResetPassword, {})

  return (
    <AuthShell
      title="Quên mật khẩu"
      description="Nhập mật khẩu quản trị để nhận link đặt lại mật khẩu qua email."
      footer={
        <Link href="/admin/login" className="text-primary-600 transition-colors hover:text-primary-700">
          Quay lại đăng nhập
        </Link>
      }
    >
      {state?.sent ? (
        <p className="text-center text-sm font-medium text-green-700" role="status">
          Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư của tài khoản quản trị rồi bấm link trong email.
        </p>
      ) : (
        <AuthForm submitLabel="Gửi link đặt lại" action={formAction}>
          <p className="text-sm text-[#5b5b5b]">
            Hệ thống sẽ gửi link đặt lại mật khẩu tới email quản trị. Link có hiệu lực trong 1 giờ.
          </p>

          <label htmlFor="login-password" className="block text-sm font-medium text-[#5b5b5b]">
            Mật khẩu quản trị
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
      )}

      {state?.error && (
        <p className="text-center text-sm font-medium text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </AuthShell>
  )
}
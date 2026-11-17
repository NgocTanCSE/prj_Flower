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
      description="Gửi link đặt lại mật khẩu tới email quản trị đã cấu hình."
      backTo="/admin/login"
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

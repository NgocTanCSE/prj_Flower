import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { AuthShell } from '@/app/(auth)/components/auth-shell'
import { ResetPasswordForm } from '@/app/(auth)/components/reset-password-form'

export const metadata: Metadata = {
  title: 'Đặt lại mật khẩu',
}

interface Props {
  searchParams: Promise<{ code?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams

  // Magic link hợp lệ phải mang mã `code` (flow PKCE).
  if (!params.code) redirect('/')

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Nhập mật khẩu mới cho tài khoản quản trị."
      backTo="/"
    >
      <ResetPasswordForm code={params.code} />
    </AuthShell>
  )
}
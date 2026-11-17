'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { AuthForm, AuthShell } from '@/app/(auth)/components/auth-shell'

export default function ResetPassword() {
  const router = useRouter()
  const clientRef = useRef<SupabaseClient | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    if (!url || !key) {
      setError('Chưa cấu hình Supabase cho site.')
      return
    }

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const hashError = hash.get('error_description') ?? hash.get('error')
    if (hashError) setError(hashError.replace(/\+/g, ' '))

    const supabase = createClient(url, key, {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    clientRef.current = supabase

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!clientRef.current || !ready) {
      setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Hãy yêu cầu link mới.')
      return
    }

    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') ?? '')
    const passwordConfirm = String(form.get('passwordConfirm') ?? '')

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    const { error: updateError } = await clientRef.current.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage('Đã đổi mật khẩu. Đang chuyển về trang đăng nhập...')
    setTimeout(() => router.replace('/admin/login'), 1500)
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Nhập mật khẩu mới cho tài khoản quản trị."
      backTo="/admin/login"
    >
      {message ? (
        <p className="text-center text-sm font-medium text-green-700" role="status">
          {message}
        </p>
      ) : (
        <AuthForm submitLabel="Cập nhật mật khẩu" onSubmit={handleSubmit}>
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

          {!ready && !error && (
            <p className="text-center text-xs text-[#5b5b5b]">Đang xác thực link đặt lại mật khẩu...</p>
          )}
        </AuthForm>
      )}

      {error && (
        <p className="text-center text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </AuthShell>
  )
}

'use client'

import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#fdfbfb] px-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-4xl font-bold text-[#8b5f65]">Đã có lỗi xảy ra</h1>
        <p className="text-[#5b5b5b]">{error.message ?? 'Một lỗi không mong muốn đã xảy ra.'}</p>
        <div className="mt-8">
          <Link href="/" className="rounded-lg bg-[#8b5f65] px-4 py-2 text-sm text-white transition-colors hover:bg-[#764f54]">
            Về trang chủ
          </Link>
        </div>
        <div className="mt-8">
          <a href="mailto:lienhe@tiemhoacobecube.com" className="text-sm text-[#999] hover:text-[#8b5f65]">
            Liên hệ hỗ trợ
          </a>
        </div>
      </div>
    </div>
  )
}

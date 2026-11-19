'use client'

/**
 * Error boundary cho toàn bộ khu vực /admin/(protected).
 *
 * Thay vì màn hình lỗi 500 mặc định của Next.js (không giải thích gì),
 * hiển thị giao diện thân thiện: nội dung lỗi cho dev, nút thử lại,
 * và log chi tiết xuống console để diagnos sau này.
 */

import { useEffect } from 'react'

interface AdminErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error('[admin] Lỗi render trang quản trị:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f4eeef] text-[#8b5f65]">
        <span className="text-xl font-bold" aria-hidden="true">!</span>
      </div>
      <h1 className="text-lg font-bold text-[#1a1a1a]">Có lỗi khi tải trang quản trị</h1>
      <p className="max-w-md text-sm text-[#5b5b5b]">
        Đây có thể là lỗi tạm thời của máy chủ hoặc dữ liệu. Hãy thử lại,
        nếu tình trạng này lặp lại liên tục vui lòng chụp màn hình gửi cho
        người phát triển kèm thời điểm xảy ra.
      </p>
      {error.message ? (
        <details className="mt-2 w-full max-w-md text-left">
          <summary className="cursor-pointer text-xs text-[#999]">Xem chi tiết lỗi (đã gửi log)</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-left text-[11px] text-red-700">
            {error.message}
          </pre>
        </details>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 rounded-lg bg-[#8b5f65] px-5 py-2 text-sm font-medium text-white
          transition-colors hover:bg-[#764f54] active:scale-[0.97]"
      >
        Thử lại
      </button>
    </div>
  )
}

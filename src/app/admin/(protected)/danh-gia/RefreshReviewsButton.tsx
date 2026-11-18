'use client'

/** Nút "Làm mới" danh giá — gọi server action kèm toast thay vì form im lặng. */

import { useState } from 'react'

import { notifyToast } from '@/components/admin/toast/toast'
import { submitRefreshReviews } from './actions'

export function RefreshReviewsButton() {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    try {
      await submitRefreshReviews()
      notifyToast('Đã làm mới danh sách đánh giá.', 'success')
    } catch (error) {
      notifyToast(error instanceof Error ? error.message : 'Làm mới thất bại.', 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-[#e8e1e1] bg-white px-4 py-2 text-sm text-[#5b5b5b]
        transition-colors hover:bg-[#f4eeef] hover:text-[#8b5f65] active:scale-[0.97]
        disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Đang làm mới...' : 'Làm mới'}
    </button>
  )
}

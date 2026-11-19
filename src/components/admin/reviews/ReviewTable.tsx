'use client'

import * as React from 'react'
import type { Review } from '@/app/admin/(protected)/danh-gia/actions'
import { updateReviewStatus, deleteReview } from '@/app/admin/(protected)/danh-gia/actions'
import { notifyToast } from '@/components/admin/toast/toast'
import { StableLabel } from '@/components/admin/StableLabel'
import { ReviewFilters } from './ReviewFilters'
import { ReviewStatusBadge, starRating, formatDate } from './ReviewStatusBadge'

interface ReviewTableProps {
  reviews: Review[]
}

export function ReviewTable({ reviews }: ReviewTableProps) {
  const [status, setStatus] = React.useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [term, setTerm] = React.useState('')
  const [busy, setBusy] = React.useState<string | null>(null)

  const listed = reviews
    .filter((review) => {
      // Chỉ lấy những đánh giá chờ duyệt / cần duyệt.
      const matchStatus = status === 'all' || (!!review.is_approved === (status === 'approved' || status === 'pending'))
      const matchTerm = !term.toLowerCase() ||
        review.customer_name.toLowerCase().includes(term.toLowerCase()) ||
        review.product_name?.toLowerCase().includes(term.toLowerCase())
      return matchStatus && matchTerm
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  async function handleStatus(id: string, payload: { status: 'approved' | 'pending' | 'rejected' }) {
    setBusy(id)
    try {
      const res = await updateReviewStatus(id, payload)
      if (res.ok) notifyToast('Cập nhật trạng thái thành công.', 'success')
      else notifyToast(res.error ?? 'Gặp lỗi.', 'error')
    } catch (error) {
      notifyToast((error as Error).message, 'error')
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete(id: string) {
    setBusy(id)
    try {
      const res = await deleteReview(id)
      if (res.ok) notifyToast('Đã xóa đánh giá.', 'success')
      else notifyToast(res.error ?? 'Gặp lỗi.', 'error')
    } catch (error) {
      notifyToast((error as Error).message, 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <ReviewFilters status={status} onStatusChange={setStatus} term={term} onTermChange={setTerm} />

      {listed.length === 0 ? (
        <p className="text-center text-sm text-[#999]">Không tìm thấy đánh giá phù hợp.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e8e1e1] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#e8e1e1] bg-[#faf5fa] text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5b5b5b]">Người</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5b5b5b] hidden md:table-cell">Sản phẩm</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5b5b5b] hidden md:table-cell">Sao</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5b5b5b] hidden md:table-cell">Nội dung</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5b5b5b] hidden md:table-cell">Trạng thái</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5b5b5b] hidden md:table-cell">Ngày</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#5b5b5b] w-[230px] text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {listed.map((review) => (
                <ReviewRow key={review.id} review={review} busy={busy} onStatusChange={handleStatus} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface ReviewRowProps {
  review: Review
  busy: string | null
  onStatusChange: (id: string, payload: { status: 'approved' | 'pending' | 'rejected' }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function ReviewRow({ review, busy, onStatusChange, onDelete }: ReviewRowProps) {
  const [status, setStatus] = React.useState<'approved' | 'pending' | 'rejected'>(review.is_approved ? 'approved' : 'pending')

  async function handleStatus(payload: { status: 'approved' | 'pending' | 'rejected' }) {
    if (busy) return
    const previous = status
    setStatus(payload.status)
    try {
      await onStatusChange(String(review.id), payload)
    } catch {
      setStatus(previous)
    }
  }

  return (
    <tr className="border-b border-[#e8e1e1] hover:bg-[#faf5fa]">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4eeef] text-sm font-bold text-[#8b5f65]">
            {review.customer_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{review.customer_name}</p>
            <p className="text-xs text-[#999]">{review.customer_email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle hidden md:table-cell text-[#5b5b5b] font-medium">{review.product_name || '-'}</td>
      <td className="px-4 py-3 align-middle hidden md:table-cell font-medium text-[#8b5f65]">
        {starRating(review.rating)}
      </td>
      <td className="px-4 py-3 align-middle hidden md:table-cell">
        <p className="line-clamp-2">{review.comment}</p>
      </td>
      <td className="px-4 py-3 align-middle hidden md:table-cell">
        <ReviewStatusBadge status={status} />
      </td>
      <td className="px-4 py-3 align-middle hidden md:table-cell text-[#5b5b5b]">{formatDate(review.created_at)}</td>
      <td className="px-4 py-3 align-middle text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleStatus({ status: 'approved' })}
            disabled={!!busy}
            className="rounded-lg bg-[#3f7f63] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#2f5e43] disabled:opacity-40"
          >
            <StableLabel reserve="Đang tải">{busy ? 'Đang tải' : 'Duyệt'}</StableLabel>
          </button>
          <button
            onClick={() => handleStatus({ status: 'pending' })}
            disabled={!!busy}
            className="rounded-lg bg-[#e2941e] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[#c77a14] disabled:opacity-40"
          >
            Chờ
          </button>
          <button
            onClick={() => handleStatus({ status: 'rejected' })}
            disabled={!!busy}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-40"
          >
            Từ chối
          </button>
          <button
            onClick={() => onDelete(String(review.id))}
            disabled={!!busy}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-40"
          >
            Xóa
          </button>
        </div>
      </td>
    </tr>
  )
}

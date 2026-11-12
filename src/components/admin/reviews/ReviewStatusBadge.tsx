'use client'

import * as React from 'react'
import type { ReviewStatus } from '@/app/admin/danh-gia/actions'

const statusStyles: Record<ReviewStatus, { bg: string; text: string; border: string; label: string }> = {
  pending: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    label: 'Chờ duyệt',
  },
  approved: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    label: 'Đã duyệt',
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    label: 'Đã từ chối',
  },
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const style = statusStyles[status]
  if (!style) {
    return null
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text} ${style.border}`}>
      <span className={`h-2 w-2 rounded-full ${style.bg} ${style.text.replace('800', '600')}`} />
      {style.label}
    </span>
  )
}

export function starRating(sao: number): string {
  return ''.padEnd(5).replace(/./g, (char, i) => i < sao ? '★' : '☆')
}

export function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return date
  }
}

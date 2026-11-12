'use client'

import * as React from 'react'
import { ReviewStatus } from '@/app/admin/danh-gia/actions'

interface ReviewFiltersProps {
  status: ReviewStatus | 'all'
  onStatusChange: (status: ReviewStatus | 'all') => void
  term: string
  onTermChange: (term: string) => void
}

export function ReviewFilters({ status, onStatusChange, term, onTermChange }: ReviewFiltersProps) {
  const statuses: (ReviewStatus | 'all')[] = ['all', 'pending', 'approved', 'rejected']

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#e8e1e1] bg-[#fdfbfb] p-3">
      <div className="relative flex-1 min-w-[240px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tìm theo tên, mã đánh giá..."
          value={term}
          onChange={(e) => onTermChange(e.target.value)}
          className="w-full rounded-lg border border-[#e8e1e1] bg-white py-2 pl-11 pr-3 text-sm outline-none
            transition-colors focus:ring-2 focus:ring-[#8b5f65]/40"
        />
      </div>

      <div className="flex items-center gap-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s as ReviewStatus | 'all')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              status === s
                ? 'bg-[#8b5f65] text-white'
                : 'text-[#5b5b5b] hover:bg-[#f4eeef] hover:text-[#8b5f65]'
            }`}
          >
            {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ duyệt' : s === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
          </button>
        ))}
      </div>
    </div>
  )
}

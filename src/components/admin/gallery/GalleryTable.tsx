'use client'

import * as React from 'react'
import type { GalleryImage } from '@/app/admin/thu-vien/actions'
import { deleteGalleryImage, updateGalleryImage } from '@/app/admin/thu-vien/actions'

export interface GalleryTableProps {
  images: GalleryImage[]
}

export function GalleryTable({ images }: GalleryTableProps) {
  const [filter, setFilter] = React.useState<'all' | 'visible' | 'hidden'>('all')
  const [busy, setBusy] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const listed = images
    .filter((img) => {
      if (filter === 'visible') return img.is_active
      if (filter === 'hidden') return !img.is_active
      return true
    })
    .sort((a, b) => a.sort_order - b.sort_order)

  async function handleDelete(id: string) {
    setBusy(id)
    setMessage(null)
    try {
      const res = await deleteGalleryImage(String(id))
      if (res.ok) setMessage({ type: 'ok', text: 'Đã xóa ảnh khỏi thư viện' })
      else setMessage({ type: 'error', text: res.error ?? 'Gặp lỗi.' })
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message })
    } finally {
      setBusy(null)
    }
  }

  async function handleToggle(id: string, is_active: boolean) {
    if (busy) return
    try {
      const res = await updateGalleryImage(String(id), { is_active })
      if (res.ok) setMessage({ type: 'ok', text: is_active ? 'Đã hiển ảnh' : 'Đã ẩn ảnh' })
      else setMessage({ type: 'error', text: res.error ?? 'Gặp lỗi.' })
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message })
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className={`rounded-lg border px-3 py-1.5 text-sm ${
          message.type === 'ok'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          {message.text}
        </p>
      )}

      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[#e8e1e1] bg-[#fdfbfb] p-2">
        {(['all', 'visible', 'hidden'] as const).map((key) => {
          const active = filter === key
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#8b5f65] text-white'
                  : 'text-[#5b5b5b] hover:bg-[#f4eeef] hover:text-[#8b5f65]'
              }`}
            >
              {key === 'all' ? 'Tất cả' : key === 'visible' ? 'Đã hiện' : 'Đã ẩn'}
            </button>
          )
        })}
      </div>

      {listed.length === 0 ? (
        <p className="text-center text-sm text-[#999]">Không có ảnh nào phù hợp.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listed.map((img) => (
            <GalleryCard
              key={img.id}
              image={img}
              busy={busy}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface GalleryCardProps {
  image: GalleryImage
  busy: string | null
  onToggle: (id: string, is_active: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function GalleryCard({ image, busy, onToggle, onDelete }: GalleryCardProps) {
  return (
    <figure className="group overflow-hidden rounded-xl border border-[#e8e1e1] bg-white transition-colors hover:shadow-[0_8px_24px_rgba(92,58,64,0.08)]">
      <div className="relative aspect-square w-full overflow-hidden bg-[#f4eeef]">
        <img
          src={image.url}
          alt={image.alt || 'ảnh thư viện'}
          className="block h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
          loading="lazy"
        />
        {!image.is_active && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
            <span className="rounded-lg border border-white/40 bg-black/40 px-3 py-1 text-xs font-medium text-white">
              Đã ẩn
            </span>
          </div>
        )}
      </div>
      <figcaption className="p-4">
        <p className="line-clamp-2 text-sm">{image.alt || '-'}</p>
        <p className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[#999]">
          <span>{image.category ? `Thể loại: ${image.category}` : 'Không có thể loại'}</span>
          <span className="font-medium">Thứ tự: {image.sort_order}</span>
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => onToggle(String(image.id), !image.is_active)}
            disabled={!!busy}
            className="rounded-lg border border-[#e8e1e1] bg-white px-3 py-1.5 text-sm text-[#5b5b5b]
              transition-colors hover:bg-[#f4eeef] hover:text-[#8b5f65] disabled:opacity-40"
          >
            {image.is_active ? 'Ẩn' : 'Hiện lại'}
          </button>
          <button
            onClick={() => onDelete(String(image.id))}
            disabled={!!busy}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700
              transition-colors hover:bg-red-50 disabled:opacity-40"
          >
            Xóa
          </button>
        </div>
      </figcaption>
    </figure>
  )
}

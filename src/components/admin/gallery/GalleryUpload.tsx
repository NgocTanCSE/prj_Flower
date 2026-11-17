'use client'

import { useState } from 'react'

import { addGalleryImage } from '@/app/admin/(protected)/thu-vien/actions'

export interface GalleryUploadProps {
  /** Các thể loại (danh mục) cho ảnh gallery. */
  categories?: string[]
}

export function GalleryUpload({ categories }: GalleryUploadProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleGallerySubmit = async (formData: FormData) => {
    setPending(true)
    setError(null)
    setMessage(null)

    try {
      await addGalleryImage(formData)
      setMessage('Đã thêm ảnh vào thư viện.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thêm ảnh thất bại.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <form action={handleGallerySubmit}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-[#5b5b5b]">Hình ảnh</label>
            <input
              type="file"
              name="file"
              accept="image/*"
              required
              className="w-full rounded-lg border border-[#e8e1e1] bg-white px-3 py-2 text-sm outline-none
                file:mr-4 file:rounded-lg file:border file:border-[#e8e1e1] file:bg-[#f4eeef]
                file:px-3 file:py-1 file:text-sm file:font-medium file:text-[#8b5f65]"
            />
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-[#5b5b5b]">Chú thích</label>
            <input
              type="text"
              name="alt"
              placeholder="Tên ảnh, mô tả ngắn..."
              className="w-full rounded-lg border border-[#e8e1e1] bg-white px-3 py-2 text-sm outline-none
                focus:ring-2 focus:ring-[#8b5f65]"
            />
          </div>

          <div className="shrink-0">
            <label className="mb-1 block text-sm font-medium text-[#5b5b5b]">Thể loại</label>
            <select
              name="category"
              className="w-40 rounded-lg border border-[#e8e1e1] bg-white px-3 py-2 text-sm outline-none
                focus:ring-2 focus:ring-[#8b5f65]"
            >
              <option value="">-- Không --</option>
              {categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="shrink-0">
            <label className="mb-1 block text-sm font-medium text-[#5b5b5b]">Thứ tự</label>
            <input
              type="number"
              name="sort_order"
              defaultValue={999}
              min={0}
              className="w-20 rounded-lg border border-[#e8e1e1] bg-white px-3 py-2 text-sm outline-none
                focus:ring-2 focus:ring-[#8b5f65]"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-lg bg-[#8b5f65] px-5 py-2 text-sm text-white transition-colors
              hover:bg-[#764f54] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Đang tải lên...' : 'Thêm ảnh'}
          </button>
        </div>
      </form>

      {message && <p className="text-sm font-medium text-green-700">{message}</p>}
      {error && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

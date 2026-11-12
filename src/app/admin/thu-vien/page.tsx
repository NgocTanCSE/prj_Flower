import { createSupabaseServerClient } from '@/lib/upload'
import { GalleryTable } from '@/components/admin/gallery/GalleryTable'
import { GalleryUpload } from '@/components/admin/gallery/GalleryUpload'
import type { GalleryImage } from './actions'

export const metadata = {
  title: 'Thư viện ảnh | Quản trị',
  description: 'Quản lý ảnh thư viện.',
}

export default async function ThuVienPage() {
  const client = await createSupabaseServerClient()

  // Ảnh đang hoạt động (`gallery_images.is_active`) sắp xếp theo thứ tự.
  const { data: images, error } = client
    ? await client.from('gallery_images').select('id, url, alt, category, sort_order, is_active, created_at').order('sort_order', { ascending: true, nullsFirst: false })
    : { data: null, error: new Error('Danh sách thư viện không khả dụng (chưa cấu hình cơ sở dữ liệu).') }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl py-8">
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-700">Đã có lỗi khi tải danh sách ảnh.</p>
          <p className="text-sm text-red-600/80">{error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Thư viện ảnh</h1>
        <p className="text-sm text-[#5b5b5b]">
          {images?.length ?? 0} ảnh trong thư viện
        </p>
      </div>

      <GalleryUpload />
      <GalleryTable images={images ?? []} />
    </main>
  )
}

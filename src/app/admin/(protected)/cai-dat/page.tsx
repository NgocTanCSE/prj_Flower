import { getSettingsForAdmin } from '@/app/admin/api/actions/settings'
import { getGalleryImages } from '@/lib/getProducts'
import { PageHeader } from '@/components/admin/PageHeader'
import { SettingsForm } from './SettingsForm'

export const metadata = {
  title: 'Cài đặt | Quản trị',
  description: 'Quản lý thông tin và cài đặt cửa hàng.',
}

export default async function CaiDatPage() {
  let settings: Awaited<ReturnType<typeof getSettingsForAdmin>>
  let loadError: string | null = null
  try {
    settings = await getSettingsForAdmin()
  } catch (error) {
    // Không nuốt lỗi: hiển thị banner để người dùng biết nguyên nhân.
    settings = []
    loadError = error instanceof Error ? error.message : 'Không thể tải cài đặt.'
  }

  // Ảnh thư viện để admin chọn nhanh làm nền banner (getGalleryImages trả [] nếu lỗi).
  const galleryImages = await getGalleryImages()

  return (
    <div className="admin-content">
      <PageHeader
        title="Cài đặt trang"
        subtitle="Thông tin liên hệ, mạng xã hội, giờ mở cửa, SEO, thương hiệu, banner trang chủ."
      />

      {loadError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <strong>Lỗi tải cài đặt:</strong> {loadError}
        </div>
      ) : null}

      <SettingsForm
        settings={settings}
        galleryImages={galleryImages.map((g) => ({ url: g.url, alt: g.alt }))}
      />
    </div>
  )
}

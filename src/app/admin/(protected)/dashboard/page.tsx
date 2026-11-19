import { getStats } from '@/app/admin/api/actions/stats'
import { getPublicProductsForAdmin } from '@/app/admin/api/actions/products'
import { HUDCard } from '@/components/admin/HUDCard'
import { Loader } from '@/components/admin/Loader'
import { PageHeader } from '@/components/admin/PageHeader'
import Link from 'next/link'

export const metadata = {
  title: 'Tổng quan | Quản trị',
  description: 'Tổng quan cửa hàng Tiệm Hoa Shop Flower.',
}

export default async function DashboardPage() {
  let stats: Awaited<ReturnType<typeof getStats>>
  let products: Awaited<ReturnType<typeof getPublicProductsForAdmin>>
  let loadError: string | null = null
  let loading = true

  try {
    ;[stats, products] = await Promise.all([getStats(), getPublicProductsForAdmin()])
  } catch (error) {
    stats = {
      viewsTotal: 0,
      totalProducts: 0,
      productsActive: 0,
      productsDraft: 0,
      productsHidden: 0,
      pendingReviews: 0,
      totalReviews: 0,
      totalGallery: 0,
    }
    products = []
    loadError = error instanceof Error ? error.message : 'Không thể tải dữ liệu tổng quan.'
  } finally {
    loading = false
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="admin-content">
      <PageHeader
        title="Tổng quan"
        subtitle="Tình hình cửa hàng hôm nay"
      />

      {loadError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <strong>Lỗi tải dữ liệu:</strong> {loadError}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
        <HUDCard
          label="Truy cập"
          value={stats.viewsTotal}
          accent="rose"
          change={{ label: 'Lượt xem', value: '90 ngày qua' }}
        />
        <HUDCard
          label="Sản phẩm"
          value={stats.totalProducts}
          accent="green"
          change={{ label: 'Đang hiển thị', value: `${stats.productsActive}` }}
        />
        <HUDCard
          label="Đánh giá chưa duyệt"
          value={stats.pendingReviews}
          accent="amber"
          change={{ label: 'Chờ', value: 'xuất bản' }}
        />
        <HUDCard
          label="Sản phẩm ẩn"
          value={stats.productsHidden}
          accent="blue"
          change={{ label: 'Ẩn', value: 'công khai' }}
        />
        <HUDCard
          label="Đánh giá"
          value={stats.totalReviews}
          accent="green"
          change={{ label: 'Được công khai', value: '' }}
        />
        <HUDCard
          label="Thư viện"
          value={stats.totalGallery}
          accent="rose"
          change={{ label: 'Ảnh', value: '' }}
        />
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e8e1e1] bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Sản phẩm gần đây</h2>
          <ul className="flex flex-col gap-3">
            {products.slice(0, 5).map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-[#e8e1e1] px-4 py-2 text-sm transition-colors hover:bg-[#faf5fa]"
              >
                <span className="font-medium text-[#1a1a1a]">{product.name}</span>
                <span className="text-sm text-[#5b5b5b]">
                  {Number(product.price).toLocaleString('vi-VN')}₫
                </span>
              </li>
            ))}
            {products.length === 0 && (
              <li className="py-6 text-center text-sm text-[#5b5b5b]">Chưa có sản phẩm nào.</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-[#e8e1e1] bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Truy cập nhanh</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/san-pham"
              className="flex flex-col gap-1 rounded-lg border border-[#e8e1e1] px-4 py-3 text-sm
                transition-colors hover:bg-[#f4eeef] hover:border-[#8b5f65]/30"
            >
              <span className="font-semibold text-[#8b5f65]">Sản phẩm</span>
              <span className="text-xs text-[#5b5b5b]">Thêm / sửa / xoá sản phẩm</span>
            </Link>
            <Link
              href="/admin/danh-muc"
              className="flex flex-col gap-1 rounded-lg border border-[#e8e1e1] px-4 py-3 text-sm
                transition-colors hover:bg-[#f4eeef] hover:border-[#8b5f65]/30"
            >
              <span className="font-semibold text-[#8b5f65]">Danh mục</span>
              <span className="text-xs text-[#5b5b5b]">Thêm / sửa / xoá danh mục</span>
            </Link>
            <Link
              href="/admin/danh-gia"
              className="flex flex-col gap-1 rounded-lg border border-[#e8e1e1] px-4 py-3 text-sm
                transition-colors hover:bg-[#f4eeef] hover:border-[#8b5f65]/30"
            >
              <span className="font-semibold text-[#8b5f65]">Đánh giá</span>
              <span className="text-xs text-[#5b5b5b]">Duyệt / xoá đánh giá</span>
            </Link>
            <Link
              href="/admin/thu-vien"
              className="flex flex-col gap-1 rounded-lg border border-[#e8e1e1] px-4 py-3 text-sm
                transition-colors hover:bg-[#f4eeef] hover:border-[#8b5f65]/30"
            >
              <span className="font-semibold text-[#8b5f65]">Thư viện</span>
              <span className="text-xs text-[#5b5b5b]">Upload / xoá ảnh</span>
            </Link>
            <Link
              href="/admin/cai-dat"
              className="flex flex-col gap-1 rounded-lg border border-[#e8e1e1] px-4 py-3 text-sm
                transition-colors hover:bg-[#f4eeef] hover:border-[#8b5f65]/30"
            >
              <span className="font-semibold text-[#8b5f65]">Cài đặt</span>
              <span className="text-xs text-[#5b5b5b]">Thông tin cửa hàng</span>
            </Link>
            <Link
              href="/admin/thong-ke"
              className="flex flex-col gap-1 rounded-lg border border-[#e8e1e1] px-4 py-3 text-sm
                transition-colors hover:bg-[#f4eeef] hover:border-[#8b5f65]/30"
            >
              <span className="font-semibold text-[#8b5f65]">Thống kê</span>
              <span className="text-xs text-[#5b5b5b]">Số liệu chi tiết</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

import { getStats } from '@/app/admin/api/actions/stats'
import { HUDCard } from '@/components/admin/HUDCard'

export const metadata = {
  title: 'Thống kê | Quản trị',
  description: 'Thống kê truy cập, đánh giá, sản phẩm.',
}

export default async function ThongKePage() {
  let stats: Awaited<ReturnType<typeof getStats>>
  try {
    stats = await getStats()
  } catch {
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
  }

  return (
    <main className="mx-auto max-w-6xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Thống kê</h1>
        <p className="text-sm text-[#5b5b5b]">Số liệu trang web hôm nay.</p>
      </div>

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
          change={{ label: 'Hiển thị', value: String(stats.productsActive) }}
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

      {/* Tổng quan */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#e8e1e1] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Tổng quan sản phẩm</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border border-[#e8e1e1] bg-[#faf5fa] px-4 py-3">
              <span className="text-sm text-[#5b5b5b]">Sản phẩm đang hiển thị</span>
              <span className="text-lg font-bold text-[#1a1a1a]">{stats.totalProducts - stats.productsHidden}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#e8e1e1] bg-[#faf5fa] px-4 py-3">
              <span className="text-sm text-[#5b5b5b]">Sản phẩm đã ẩn</span>
              <span className="text-lg font-bold text-[#1a1a1a]">{stats.productsHidden}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#e8e1e1] bg-[#faf5fa] px-4 py-3">
              <span className="text-sm text-[#5b5b5b]">Đánh giá công khai</span>
              <span className="text-lg font-bold text-[#1a1a1a]">{stats.totalReviews}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e8e1e1] bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a]">Đánh giá chờ duyệt</h2>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <span className="text-4xl font-bold text-[#8b5f65]">{stats.pendingReviews}</span>
            <p className="text-sm text-[#5b5b5b]">
              {stats.pendingReviews === 0
                ? 'Không có đánh giá nào cần duyệt.'
                : `Bạn cần duyệt ${stats.pendingReviews} đánh giá đã ẩn.`}
            </p>
          </div>
          <div className="mt-4 text-center">
            <a
              href="/admin/danh-gia"
              className="text-sm font-medium text-[#8b5f65] hover:underline"
            >
              Xem tất cả đánh giá
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

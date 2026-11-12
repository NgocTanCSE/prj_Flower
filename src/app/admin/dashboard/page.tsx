import { getStats } from '@/app/admin/api/actions/stats'
import { getPublicProductsForAdmin } from '@/app/admin/api/actions/products'
import { HUDCard } from '@/components/admin/HUDCard'
import { Loader } from '@/components/admin/Loader'

export const metadata = {
  title: 'Tổng quan | Quản trị',
  description: 'Tổng quan cửa hàng Tiệm Hoa CoBeCuBe.',
}

export default async function DashboardPage() {
  let stats: Awaited<ReturnType<typeof getStats>>
  let products: Awaited<ReturnType<typeof getPublicProductsForAdmin>>
  let loading = true

  try {
    ;[stats, products] = await Promise.all([getStats(), getPublicProductsForAdmin()])
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
    products = []
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
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Tổng quan</h1>
        <p className="text-sm text-[#5b5b5b]">Tình hình cửa hàng hôm nay</p>
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
                className="flex items-center justify-between rounded-lg border border-[#e8e1e1] px-4 py-2 text-sm"
              >
                <span className="font-medium text-[#1a1a1a]">{product.name}</span>
                <span className="text-sm text-[#5b5b5b]">
                  {product.price.toLocaleString('vi-VN')}₫
                </span>
              </li>
            ))}
            {products.length === 0 && (
              <li className="py-6 text-center text-sm text-[#5b5b5b]">Chưa có sản phẩm nào.</li>
            )}
          </ul>
        </div>
      </section>
    </main>
  )
}

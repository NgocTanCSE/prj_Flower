import { createSupabaseServerClient } from '@/lib/upload'
import { ReviewTable } from '@/components/admin/reviews/ReviewTable'
import { refreshReviews, submitRefreshReviews } from './actions'

export const metadata = {
  title: 'Danh giá | Quản trị',
  description: 'Quản lý đánh giá từ khách hàng.',
}

export default async function DanhGiaPage() {
  const client = await createSupabaseServerClient()

  // Đánh giá + tên sản phẩm (join qua bảng `products`).
  const { data: reviews, error } = await client
    .from('reviews')
    .select('*, product_name:products(name)')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="mx-auto max-w-6xl py-8">
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-700">Đã có lỗi khi tải danh sách đánh giá.</p>
          <p className="text-sm text-red-600/80">{error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Danh sách đánh giá</h1>
          <p className="text-sm text-[#5b5b5b]">
            {reviews?.length ?? 0} đánh giá trong hệ thống
          </p>
        </div>
        <form action={submitRefreshReviews}>
          <button
            type="submit"
            className="rounded-lg border border-[#e8e1e1] bg-white px-4 py-2 text-sm
              text-[#5b5b5b] transition-colors hover:bg-[#f4eeef] hover:text-[#8b5f65]"
          >
            Làm mới
          </button>
        </form>
      </div>

      <ReviewTable reviews={reviews ?? []} />
    </main>
  )
}

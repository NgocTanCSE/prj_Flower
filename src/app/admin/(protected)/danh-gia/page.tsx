import { createSupabaseServerClient } from '@/lib/upload'
import { ReviewTable } from '@/components/admin/reviews/ReviewTable'
import { RefreshReviewsButton } from './RefreshReviewsButton'
import { PageHeader } from '@/components/admin/PageHeader'
import type { Review } from './actions'

export const metadata = {
  title: 'Danh giá | Quản trị',
  description: 'Quản lý đánh giá từ khách hàng.',
}

export default async function DanhGiaPage() {
  const client = await createSupabaseServerClient()

  // Đánh giá + tên sản phẩm (join qua bảng `products`).
  // Lưu ý: `products(name)` trả về object `{ name }`, phải map sang chuỗi
  // trước khi truyền xuống client — nếu để nguyên object, React báo lỗi #31
  // ("Objects are not valid as a React child ... with keys {name}").
  const { data: reviews, error } = client
    ? await client.from('reviews').select('*, products(name)').order('created_at', { ascending: false })
    : { data: null, error: new Error('Danh sách đánh giá không khả dụng (chưa cấu hình cơ sở dữ liệu).') }

  const rows: Review[] = (reviews ?? []).map((row) => ({
    ...row,
    product_name: row.products?.name,
  }))

  return (
    <div className="space-y-6 py-8">
      <PageHeader
        title="Danh sách đánh giá"
        subtitle={`${rows.length} đánh giá trong hệ thống`}
        action={<RefreshReviewsButton />}
      />

      {error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-center"
        >
          <p className="text-sm font-medium text-red-700">Đã có lỗi khi tải danh sách đánh giá.</p>
          <p className="text-sm text-red-600/80">{error.message}</p>
        </div>
      ) : (
        <ReviewTable reviews={rows} />
      )}
    </div>
  )
}

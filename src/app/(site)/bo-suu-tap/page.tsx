/**
 * Trang bộ sưu tập `/bo-suu-tap`, lọc danh mục/giá/sắp xếp, phân trang server.
 */
import Link from 'next/link'

import { ProductCard } from '@/components/site/ProductCard'
import { SectionTitle } from '@/components/site/SectionTitle'
import { Cards } from '@/components/site/Cards'
import { getCategories, getProducts, formatCount, type ProductSort } from '@/lib/getProducts'

export const metadata = {
  title: 'Bộ sưu tập | CoBeCuBe - Hoa tươi',
  description: 'Xem tất cả bó hoa: hồng, tulip, lan, hướng dương... Đặt hoa online.',
}

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá tăng', value: 'price-asc' },
  { label: 'Giá giảm', value: 'price-desc' },
  { label: 'Tên A-Z', value: 'name-asc' },
  { label: 'Được bán', value: 'popular' },
]

interface BoSuutapPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Xây dựng URL phân trang từ tham số tìm kiếm (chỉ cập nhật `page`). */
function pageUrl(params: URLSearchParams, page: number): string {
  params.set('page', String(page))
  return `/bo-suu-tap/?${params.toString()}`
}

export default async function BoSuutapPage({ searchParams }: BoSuutapPageProps) {
  const query = await searchParams

  const page = parseInt((query.page as string) ?? '1', 10) || 1
  const category = (query.category as string) ?? 'all'
  const sort = (query.sort as string) as ProductSort ?? 'newest'
  const minPrice = parseInt((query.minPrice as string) ?? '0', 10) || 0
  const maxPrice = parseInt((query.maxPrice as string) ?? '0', 10) || 0
  const q = (query.q as string) ?? ''

  const [products, categories] = await Promise.all([
    getProducts({ page, category, sort, minPrice, maxPrice, q }),
    getCategories(),
  ])

  const params = new URLSearchParams(query as Record<string, string>)
  const lastPage = Math.max(1, Math.ceil(products.total / products.perPage))

  return (
    <>
      <section className="section bg-[var(--color-tag-bg)]">
        <div className="container">
          <SectionTitle label="Bộ sưu tập" title="Tất cả bó hoa" subtitle="Lọc theo danh mục hoa yêu thích của bạn." align="center" />
          <form action="/bo-suu-tap" method="get" className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <select
              name="category"
              defaultValue={category}
              className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
              <option value="all"> Tất cả</option>
            </select>
            <select
              name="sort"
              defaultValue={sort}
              className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="minPrice"
              placeholder="Từ giá (VNĐ)"
              defaultValue={minPrice}
              min={0}
              className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <input
              type="number"
              name="maxPrice"
              placeholder="Đến giá (VNĐ)"
              defaultValue={maxPrice}
              min={0}
              className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                name="q"
                placeholder="Tìm kiếm..."
                defaultValue={q}
                className="flex-1 rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button type="submit" className="btn btn-primary">
                Tìm
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="text-sm text-[var(--color-ink-light)] mb-6">
            {products.total === 0 ? (
              'Hiện không có sản phẩm phù hợp.'
            ) : (
              <span>
                Có {formatCount(products.total)} sản phẩm, đang trang {products.page}/{lastPage}
              </span>
            )}
          </p>
          <Cards cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.items.length > 0 ? (
              products.items.map((p) => <ProductCard key={p.id} product={p} showBadge={false} />)
            ) : (
              <p className="col-span-full text-center text-sm text-[var(--color-ink-light)]">
                Hiện không có sản phẩm phù hợp.
              </p>
            )}
          </Cards>

          {/* Pagination */}
          <div className="flex justify-center gap-3 py-10">
            {products.page > 1 && (
              <Link href={pageUrl(params, products.page - 1)} className="btn btn-ghost">
                Trang trước
              </Link>
            )}
            {products.hasMore && (
              <>
                <Link href={pageUrl(params, products.page + 1)} className="btn btn-primary">
                  Tải thêm
                </Link>
                <Link href={pageUrl(params, 1)} className="btn btn-ghost">
                  Xem trang đầu
                </Link>
              </>
            )}
            {products.page < lastPage && products.page > 1 && (
              <Link href={pageUrl(params, lastPage)} className="btn btn-ghost">
                Trang cuối
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

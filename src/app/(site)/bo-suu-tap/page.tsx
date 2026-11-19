/**
 * Trang bộ sưu tập `/bo-suu-tap`, lọc danh mục/giá/sắp xếp, phân trang server.
 */
import Link from 'next/link'

import { ProductCard } from '@/components/site/ProductCard'
import { SectionTitle } from '@/components/site/SectionTitle'
import { CollectionFilter } from '@/components/site/CollectionFilter'
import { Cards } from '@/components/site/Cards'
import { getCategories, getProducts, type ProductSort } from '@/lib/getProducts'

export const metadata = {
  title: 'Bộ sưu tập | Shop Flower - Hoa tươi',
  description: 'Xem tất cả bó hoa: hồng, tulip, lan, hướng dương... Đặt hoa online.',
}

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
  const sort = ((query.sort as string) ?? 'newest') as ProductSort
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
          <SectionTitle
            label="Bộ sưu tập"
            title="Tất cả bó hoa"
            subtitle="Chọn danh mục, khoảng giá hoặc tìm theo tên — tất cả ngay tại đây."
            align="center"
          />
          <CollectionFilter
            categories={categories}
            category={category}
            sort={sort}
            minPrice={minPrice}
            maxPrice={maxPrice}
            q={q}
            total={products.total}
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Cards cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.items.length > 0 ? (
              products.items.map((p) => <ProductCard key={p.id} product={p} showBadge={false} />)
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-[var(--color-border)] bg-white/60 py-16 text-center">
                <p className="text-lg text-[var(--color-ink)]">Chưa tìm thấy bó hoa phù hợp</p>
                <p className="mt-1 text-sm text-[var(--color-ink-light)]">Thử bỏ bớt bộ lọc hoặc chọn danh mục khác nhé.</p>
                <Link href="/bo-suu-tap" className="btn btn-primary mt-6">
                  Xem tất cả bó hoa
                </Link>
              </div>
            )}
          </Cards>

          {/* Phân trang */}
          {lastPage > 1 && (
            <nav aria-label="Phân trang" className="mt-12 flex items-center justify-center gap-3">
              {products.page > 1 ? (
                <Link href={pageUrl(params, products.page - 1)} className="btn btn-ghost">
                  ← Trước
                </Link>
              ) : (
                <span className="btn btn-ghost cursor-not-allowed opacity-40" aria-disabled="true">
                  ← Trước
                </span>
              )}
              <span className="text-sm text-[var(--color-ink-light)]">
                Trang {products.page} / {lastPage}
              </span>
              {products.hasMore ? (
                <Link href={pageUrl(params, products.page + 1)} className="btn btn-primary">
                  Tiếp →
                </Link>
              ) : (
                <span className="btn btn-ghost cursor-not-allowed opacity-40" aria-disabled="true">
                  Tiếp →
                </span>
              )}
            </nav>
          )}
        </div>
      </section>
    </>
  )
}

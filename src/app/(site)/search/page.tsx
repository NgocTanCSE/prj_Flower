/**
 * Trang tìm kiếm `/search` — tìm từ khóa (qua URL `q`) và danh mục.
 */
import Link from 'next/link'

import { ProductCard } from '@/components/site/ProductCard'
import { SectionTitle } from '@/components/site/SectionTitle'
import { Cards } from '@/components/site/Cards'
import { getCategories, getProducts, formatCount } from '@/lib/getProducts'
import type { ProductSort } from '@/lib/getProducts'

export const metadata = {
  title: 'Tìm kiếm hoa | CoBeCuBe',
  description: 'Tìm kiếm bó hoa yêu thích: hồng, tulip, lan, hướng dương...',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = await searchParams
  const search = (query.q as string) ?? (query.search as string) ?? ''
  const category = (query.category as string) ?? 'all'
  const page = parseInt((query.page as string) ?? '1', 10) || 1
  const sort = (query.sort as string) as ProductSort ?? 'newest'

  const { items, total, hasMore, perPage } = await getProducts({ page, category, sort, q: search })
  const categories = await getCategories()

  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const queryStr = search ? `&q=${encodeURIComponent(search)}` : ''

  return (
    <section className="section bg-[var(--color-page)]">
      <div className="container">
        <SectionTitle
          label="Tìm kiếm"
          title={`Kết quả "${search ?? ''}"`}
          subtitle="Danh sách sản phẩm phù hợp."
          align="center"
        />

        {/* Bộ lọc nhanh */}
        <form action="/search" method="get" className="flex flex-wrap gap-3 mb-8">
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Tìm kiếm sản phẩm..."
            className="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm bg-white flex-1 min-w-[240px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <select
            name="category"
            defaultValue={category}
            className="rounded-full border border-[var(--color-border)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            <option value="all">Tất cả</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name.trim()}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Tìm
          </button>
        </form>

        <p className="text-sm text-[var(--color-ink-light)] mb-4">
          {total === 0 ? 'Không tìm thấy sản phẩm nào.' : `${formatCount(total)} sản phẩm tìm thấy`}
        </p>

        {total === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-[var(--color-ink-light)]">Chưa có sản phẩm phù hợp.</p>
            <Link href="/bo-suu-tap" className="btn btn-primary mt-4">
              Xem tất cả bó hoa
            </Link>
          </div>
        ) : (
          <Cards cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => <ProductCard key={p.id} product={p} showBadge={false} />)}
          </Cards>
        )}

        {hasMore && total > 0 && (
          <div className="flex justify-center gap-3 py-10">
            <Link href={`/search/?q=${encodeURIComponent(search)}&page=${page + 1}${queryStr}`} className="btn btn-primary">
              Tải thêm
            </Link>
            <Link href="/search/?page=1" className="btn btn-ghost">
              Trang đầu
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

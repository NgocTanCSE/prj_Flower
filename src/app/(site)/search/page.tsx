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
  title: 'Tìm kiếm hoa | Shop Flower',
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
        <form
          action="/search"
          method="get"
          className="mx-auto mb-10 flex max-w-3xl flex-col gap-3 rounded-full border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-card)] sm:flex-row sm:items-center"
        >
          <label htmlFor="search-q" className="sr-only">
            Từ khóa tìm kiếm
          </label>
          <input
            id="search-q"
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full min-w-0 flex-1 rounded-full border-0 bg-transparent px-5 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-lighter)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          />
          <label htmlFor="search-category" className="sr-only">
            Danh mục
          </label>
          <select
            id="search-category"
            name="category"
            defaultValue={category}
            className="field field-select w-full shrink-0 sm:w-52"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name.trim()}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary shrink-0 px-8">
            Tìm
          </button>
        </form>

        <p className="mb-6 text-sm text-[var(--color-ink-light)]">
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
          <Cards cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

'use client';

import Link from 'next/link';

import type { Category } from '@/lib/getProducts';

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Bán chạy', value: 'popular' },
  { label: 'Giá thấp → cao', value: 'price-asc' },
  { label: 'Giá cao → thấp', value: 'price-desc' },
  { label: 'Tên A → Z', value: 'name-asc' },
] as const;

interface CollectionFilterProps {
  categories: Category[];
  category: string;
  sort: string;
  minPrice: number;
  maxPrice: number;
  q: string;
  total: number;
}

/**
 * Bộ lọc của trang bộ sưu tập.
 *
 * - Danh mục là các "chip" bấm một phát (dễ hơn dropdown, thấy ngay đang chọn gì).
 * - Sắp xếp tự áp dụng khi đổi; giá & từ khóa áp dụng khi bấm "Tìm hoa" (hoặc Enter).
 * - Không hiển thị số `0` vô nghĩa trong ô giá, có nút xóa lọc và luôn thấy kết quả.
 */
export function CollectionFilter({ categories, category, sort, minPrice, maxPrice, q, total }: CollectionFilterProps) {
  const hasFilters = category !== 'all' || minPrice > 0 || maxPrice > 0 || q !== '' || sort !== 'newest';

  /** Giữ nguyên các lọc khác khi người dùng đổi danh mục. */
  function categoryHref(slug: string): string {
    const params = new URLSearchParams();
    if (slug !== 'all') params.set('category', slug);
    if (sort !== 'newest') params.set('sort', sort);
    if (minPrice > 0) params.set('minPrice', String(minPrice));
    if (maxPrice > 0) params.set('maxPrice', String(maxPrice));
    if (q !== '') params.set('q', q);
    const query = params.toString();
    return query ? `/bo-suu-tap?${query}` : '/bo-suu-tap';
  }

  const chips = [{ slug: 'all', name: 'Tất cả' }, ...categories.map((c) => ({ slug: c.slug, name: c.name.trim() }))];

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      {/* Danh mục dạng chip */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {chips.map((chip) => {
          const active = chip.slug === category || (chip.slug === 'all' && category === 'all');
          return (
            <Link
              key={chip.slug}
              href={categoryHref(chip.slug)}
              aria-current={active ? 'page' : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_8px_18px_rgba(169,87,109,0.22)]'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              }`}
            >
              {chip.name}
            </Link>
          );
        })}
      </div>

      <div className="my-5 h-px bg-[var(--color-border)]" />

      {/* Từ khóa, giá, sắp xếp */}
      <form action="/bo-suu-tap" method="get" className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
        <input type="hidden" name="category" value={category} />

        <div className="relative md:col-span-4">
          <label htmlFor="filter-q" className="sr-only">
            Tìm kiếm theo tên hoa
          </label>
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-lighter)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input id="filter-q" name="q" type="search" defaultValue={q} placeholder="Tìm tên hoa..." className="field pl-11" />
        </div>

        <label htmlFor="filter-min" className="sr-only">
          Giá từ
        </label>
        <input
          id="filter-min"
          name="minPrice"
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={minPrice > 0 ? minPrice : ''}
          placeholder="Giá từ"
          className="field md:col-span-2"
        />

        <label htmlFor="filter-max" className="sr-only">
          Giá đến
        </label>
        <input
          id="filter-max"
          name="maxPrice"
          type="number"
          min={0}
          inputMode="numeric"
          defaultValue={maxPrice > 0 ? maxPrice : ''}
          placeholder="Giá đến"
          className="field md:col-span-2"
        />

        <label htmlFor="filter-sort" className="sr-only">
          Sắp xếp theo
        </label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={sort}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="field field-select md:col-span-2"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-primary md:col-span-2">
          Tìm hoa
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-ink-light)]">
        <span>
          {total > 0 ? (
            <>
              Tìm thấy <strong className="text-[var(--color-ink)]">{total}</strong> bó hoa
            </>
          ) : (
            'Không có bó hoa nào phù hợp'
          )}
        </span>
        {hasFilters && (
          <Link href="/bo-suu-tap" className="font-medium text-[var(--color-primary)] underline-offset-4 hover:underline">
            Xóa bộ lọc
          </Link>
        )}
      </div>
    </div>
  );
}

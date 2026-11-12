'use client';

import Image from 'next/image';
import Link from 'next/link';

import { formatPrice, slugify, type Product, type ProductImage } from '@/lib/getProducts';

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
}

/** Ảnh đại diện của sản phẩm (ảnh chính hoặc ảnh đầu tiên). */
function primaryImage(images?: ProductImage[]): string {
  const list = (images ?? []).filter((i) => i.is_primary).sort((a, b) => a.sort_order - b.sort_order)
  if (list.length > 0) return list[0].url
  return `https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=800&q=80`
}

export function ProductCard({ product, showBadge = true }: ProductCardProps) {
  const badge = showBadge ? (product.featured_is ? 'Nổi bật' : '') : '';
  const description = product.short_desc && product.short_desc.length > 0 ? product.short_desc : '';
  const imageSrc = primaryImage(product.product_images);
  const priceText = formatPrice(product.price);

  return (
    <article className="group relative bg-white rounded-lg border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-hover)] hover:-translate-y-1">
      <div className="relative aspect-[4/5] bg-[var(--color-bg-alt)]">
        <Image
          src={imageSrc}
          alt={product.name}
          width={800}
          height={1000}
          className="w-full h-full object-cover transition-transform duration-450 group-hover:scale-104"
          loading="lazy"
        />
        {badge !== undefined && badge.length > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-[var(--color-tag-text)] px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-wide text-white">
            {badge}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h3 className="text-[1.25rem] font-[var(--font-display)] leading-tight">
          <Link href={`/san-pham/${product.slug}`} className="hover:text-[var(--color-primary)]">
            {product.name}
          </Link>
        </h3>
        {description.length > 0 && <p className="text-sm text-[var(--color-ink-light)]">{description}</p>}
        <div className="flex items-baseline gap-2">
          <p className="text-base font-semibold text-[var(--color-primary)]">{priceText}</p>
          {product.old_price !== null && product.old_price > product.price && (
            <p className="text-sm text-[var(--color-ink-lighter)] line-through">{formatPrice(product.old_price)}</p>
          )}
        </div>
        <a
          href={`https://zalo.me/0905888123?text=${encodeURIComponent(`Xin chào Tiệm Hoa CoBeCuBe, mình muốn đặt mẫu ${product.name}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary border-0"
        >
          Đặt hoa
        </a>
      </div>
    </article>
  );
}

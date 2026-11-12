/**
 * Trang chi tiết sản phẩm `/san-pham/[slug]`: gallery, giá, mô tả, bình luận,
 * sản phẩm tương tự.
 */
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { SectionTitle } from '@/components/site/SectionTitle'
import { Cards } from '@/components/site/Cards'
import { Testimonials } from '@/components/site/Testimonials'
import { ProductCard } from '@/components/site/ProductCard'
import {
  getFeaturedProducts,
  getProductBySlug,
  getProductReviews,
  formatPrice,
  type Product,
  type ProductImage,
  type Review,
} from '@/lib/getProducts'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Không tìm thấy | CoBeCuBe', description: 'Sản phẩm không tồn tại' }
  const images = product.product_images ?? []
  return {
    title: `${product.name} | CoBeCuBe - Hoa tươi`,
    description: product.short_desc || product.description || `Mua ${product.name} giá ${formatPrice(product.price)} tại CoBeCuBe.`,
    openGraph: {
      title: product.name,
      description: product.short_desc,
      images: images.length > 0 ? [{ url: images[0].url, width: 600, height: 750, alt: product.name }] : [],
    },
  }
}

/** Render phía server mỗi yêu cầu ( Slug biết khi runtime, db public ) nên
 * không static-generate – `force-dynamic` + `revalidate: 0`. */
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ICON = {
  truck: (
    <svg key="truck" className="w-5 h-5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75h1.5v-4.5h-1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12.75h2.25l1.5-4.5h7.5l1.5 4.5H21v5.25h-3.75l-1.5-4.5h-7.5l-1.5 4.5H3v5.25z" />
    </svg>
  ),
  map: (
    <svg key="map" className="w-5 h-5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.125-7.5 13.5-7.5 13.5S4.5 17.625 4.5 10.5a7.5 7.5 0 0 1 15 0z" />
    </svg>
  ),
  heart: (
    <svg key="heart" className="w-5 h-5 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.9-2.5-5.2-5.5-5.2S10 5.35 10 8.25c0 5.5 4.5 9.7 5.5 10.4h.1C20.9 17.95 21 13.75 21 8.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.65v-9.6l-4.2 4.2-.8-.8L12 7.65l5.1 5.1-.8.8L13.5 9.05v9.6h-1.5z" />
    </svg>
  ),
  arrow: (
    <svg key="arrow" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12l6.75-7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h20.25" />
    </svg>
  ),
} as const

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) notFound()

  const images = product.product_images ?? []
  const mainImage = images.filter((i) => i.is_primary).sort((a, b) => a.sort_order - b.sort_order)[0] ?? images[0]
  const reviews: Review[] = await getProductReviews(product.id)
  const related = await getFeaturedProducts(4)

  return (
    <main className="min-h-screen bg-[var(--color-page)]">
      <div className="container py-6 md:py-8">
        <div className="mb-4">
          <Link href="/bo-suu-tap" className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-light)] hover:text-[var(--color-primary)]">
            {ICON.arrow}
            Trở về danh sách
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-[var(--shadow-card)]">
              <Image
                src={mainImage?.url ?? 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=800&q=80'}
                alt={mainImage?.alt ?? product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {product.featured_is && (
                <span className="absolute top-4 left-4 rounded-full bg-[var(--color-tag-text)] px-3 py-1 text-sm font-semibold uppercase tracking-wide text-white shadow">
                  Nổi bật
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((image) => (
                  <div key={image.id} className="relative aspect-[4/5] overflow-hidden rounded-lg border-2 border-[var(--color-border)]">
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-[var(--font-display)] font-bold text-[var(--color-ink)]">{product.name}</h1>
              {product.featured_is && (
                <span className="text-sm font-medium text-[var(--color-success)]">Sản phẩm nổi bật</span>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-bold text-[var(--color-primary)]">{formatPrice(product.price)}</p>
              {product.old_price !== null && product.old_price > product.price && (
                <p className="text-sm text-[var(--color-ink-lighter)] line-through">{formatPrice(product.old_price)}</p>
              )}
              {product.old_price !== null && product.old_price > product.price && (
                <span className="text-sm font-semibold text-[var(--color-success)]">
                  Giảm {(product.old_price - product.price).toLocaleString('vi-VN')}₫
                </span>
              )}
            </div>

            <p className="text-[var(--color-ink-light)] leading-relaxed">{product.short_desc}</p>
            <p className="text-[var(--color-ink-light)] leading-relaxed">{product.description}</p>

            <div className="space-y-3 border-y border-[var(--color-border)] py-4">
              <div className="flex items-center gap-3 text-sm">
                {ICON.truck}
                <span>Giao nhanh nội thành TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {ICON.map}
                <span>Nhận hàng trong vòng 3 giờ</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {ICON.heart}
                <span>Bảo đảm tươi mới khi giao</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={orderUrl(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary flex-1 rounded-full"
              >
                Đặt hoa qua Zalo
              </a>
              <a
                href="https://m.me/cocobebe.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary flex-1 rounded-full"
              >
                Nhắn Messenger
              </a>
            </div>

            <div className="text-xs text-[var(--color-ink-lighter)]">
              Cập nhật lần cuối: {new Date(product.updated_at ?? Date.now()).toLocaleDateString('vi-VN')} · Đã xem{' '}
              <span>{product.views}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Đánh giá sản phẩm */}
      {reviews.length > 0 && (
        <section className="section bg-[var(--color-tag-bg)]">
          <div className="container">
            <SectionTitle
              title="Đánh giá khách hàng"
              subtitle={`Những nhận xét về ${product.name}`}
              align="center"
            />
            <Testimonials reviews={reviews} />
          </div>
        </section>
      )}

      {/* Sản phẩm tương tự */}
      {related.length > 0 && (
        <section className="section bg-[var(--color-page)]">
          <div className="container">
            <SectionTitle
              label="Cũng thích"
              title="Gợi ý cho bạn"
              subtitle="Những sản phẩm được yêu thích nhất hiện tại."
              align="center"
            />
            <Cards cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} showBadge={false} />
              ))}
            </Cards>
          </div>
        </section>
      )}
    </main>
  )
}

function orderUrl(name: string): string {
  const msg = `Xin chào Tiệm Hoa CoBeCuBe, mình muốn đặt mẫu ${name}.`
  return `https://zalo.me/0905888123?text=${encodeURIComponent(msg)}`
}

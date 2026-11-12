/**
 * Trang giới thiệu `/gioi-thieu`: nội dung `about_text` từ cài đặt site,
 * lưới dịch vụ theo danh mục hoa (sinh nhật, cưới, chia buồn, trang trí, quà),
 * liên hệ nhanh.
 */
import Link from 'next/link'

import { SectionTitle } from '@/components/site/SectionTitle'
import { Cards } from '@/components/site/Cards'
import { getCategories, getGalleryImages, getSetting, type Category } from '@/lib/getProducts'

export const metadata = {
  title: 'Giới thiệu | CoBeCuBe - Hoa tươi',
  description: 'Giới thiệu Tiệm Hoa CoBeCuBe — chuyên hoa tươi, hoa cưới, quà tặng giao hàng nhanh.',
}

const CATEGORY_ICONS: Record<string, string> = {
  'hoa-sinh-nhat': '🎂',
  'hoa-cuoi': '💍',
  'hoa-chia-buon': '🕯',
  'hua-trang-tri': '🌸',
  'qua-tang': '🎁',
}


export default async function GioiThieuPage() {
  const [categories, gallery, about, phone, address, hours] = await Promise.all([
    getCategories(),
    getGalleryImages(),
    getSetting('about_text'),
    getSetting('phone'),
    getSetting('address'),
    getSetting('business_hours'),
  ])

  return (
    <>
      {/* Hero nhỏ: giới thiệu shop */}
      <section className="section bg-[var(--color-tag-bg)]">
        <div className="container max-w-4xl text-center">
          <h1 className="mb-6 text-4xl text-[var(--color-ink)]">Giới thiệu Tiệm Hoa CoBeCuBe</h1>
          <div className="text-sm leading-relaxed text-[var(--color-ink-light)]">
            {about.split('.').filter(Boolean).map((sentence, i) => (
              <p key={i} className="mb-3">
                {sentence.trim()}.
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Dịch vụ: danh mục hoa */}
      <section className="section">
        <div className="container">
          <SectionTitle
            label="Dịch vụ"
            title="Loại hoa chúng tôi cung cấp"
            subtitle="Từ nguyên liệu tươi đến thiết kế chuyên nghiệp theo từng dịp."
            align="center"
          />
          <Cards cols="grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {categories.length > 0 ? (
              categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/bo-suu-tap?category=${c.slug}`}
                  className="group relative block overflow-hidden rounded-xl border border-[var(--color-border)] bg-white p-6 text-center shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-hover)] hover:-translate-y-1"
                >
                  <span className="mb-3 block text-4xl">{CATEGORY_ICONS[c.slug] ?? '🌷'}</span>
                  <h3 className="text-lg font-[var(--font-display)] font-medium text-[var(--color-ink)] group-hover:text-[var(--color-primary)]">
                    {c.name.trim()}
                  </h3>
                  <p className="text-sm text-[var(--color-ink-light)]">
                    Tìm theo <span className="font-medium text-[var(--color-primary)]">{c.name.trim()}</span>
                  </p>
                </Link>
              ))
            ) : (
              [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] animate-pulse" />
              ))
            )}
          </Cards>
        </div>
      </section>

      {/* Thư viện shop */}
      {gallery.length > 0 && (
        <section className="section bg-[var(--color-tag-bg)]">
          <div className="container">
            <SectionTitle label="Khoảnh khắc" title="Cận cảnh tiệm hoa" subtitle="Những khoảnh khắc đẹp của shop." align="center" />
            <Cards cols="grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {gallery.slice(0, 4).map((image) => (
                <div key={image.id} className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-[var(--shadow-card)]">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    width={400}
                    height={500}
                  />
                </div>
              ))}
            </Cards>
          </div>
        </section>
      )}

      {/* Liên hệ nhanh */}
      <section className="section">
        <div className="container">
          <SectionTitle
            label="Liên hệ"
            title="Gặp gỡ chúng tôi"
            subtitle="Đặt hoa ngay qua Zalo, Messenger hoặc điện thoại."
            align="center"
          />
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
              <h3 className="mb-4 text-lg font-[var(--font-display)] font-medium text-[var(--color-primary)]">Liên hệ</h3>
              <ul className="space-y-3 text-sm text-[var(--color-ink-light)]">
                <li><strong>Điện thoại:</strong> {phone ?? '0905.888.123'}</li>
                <li><strong>Địa chỉ:</strong> {address}</li>
                <li><strong>Email:</strong> <a href="mailto:hello@cocobebe.vn" className="hover:text-[var(--color-primary)]">hello@cocobebe.vn</a></li>
              </ul>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
              <h3 className="mb-4 text-lg font-[var(--font-display)] font-medium text-[var(--color-primary)]">Giờ mở cửa</h3>
              <p className="text-sm text-[var(--color-ink-light)]">{hours ?? 'Thứ Hai - Chủ Nhật: 08:00 - 21:00'}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

/**
 * TRANG CHỦ: Hero, Bộ sưu tập, Giới thiệu, Liên hệ, Đánh giá, Đăng ký nhận tin.
 */
import Link from 'next/link'

import { SectionTitle } from '@/components/site/SectionTitle'
import { Cards } from '@/components/site/Cards'
import { Hero } from '@/components/site/Hero'
import { Testimonials } from '@/components/site/Testimonials'
import { Newsletter } from '@/components/site/Newsletter'
import { ProductCard } from '@/components/site/ProductCard'
import { getFeaturedProducts, getGalleryImages, getReviews, getSetting } from '@/lib/getProducts'

export const metadata = {
  title: 'Trang chủ | CoBeCuBe - Hoa tươi trọn niềm vui',
  description: 'Tiệm Hoa CoBeCuBe - hoa tươi, hoa cưới, quà tặng giao nhanh tại TP. Hồ Chí Minh.',
}

const ABOUT_BLOCKS = [
  {
    title: 'Bó hoa tươi mỗi ngày',
    text: 'Hàng ngày khu vườn chọn lọc các loại hoa tươi mới đựng, đẹp và chất lượng.',
  },
  {
    title: 'Hỗ trợ đặt online',
    text: 'Đặt quà tặng trực tục hoặc qua điện thoại, hỗ trợ giao nhanh nội thành.',
  },
  {
    title: 'Thông tin liên hệ',
    text: '123 Nguyễn Thị Định, Quận 7, TP. Hồ Chí Minh - Zalo/Messenger',
  },
]

export default async function HomePage() {
  const [gallery, featured, reviews] = await Promise.all([
    getGalleryImages(),
    getFeaturedProducts(9),
    getReviews(6),
  ])

  const zalo = await getSetting('zalo_link')
  const messenger = await getSetting('messenger_link')
  const phone = await getSetting('phone')
  const hours = await getSetting('business_hours')

  return (
    <>
      <Hero
        title="Bó hoa đẹp cho bạn yêu thương"
        subtitle="Nền hoa tươi nối liền yêu thương."
        eyebrow="Xem Online — Hoa gửi tận tay"
        bgImage={gallery[0]?.url ?? 'https://images.unsplash.com/photo-1457089297567-b252332be3cb?auto=format&fit=crop&w=1920&q=80'}
        bgAlt="Bó hoa tươi xanh"
        ctaZalo={zalo ?? 'https://zalo.me/0905888123'}
        ctaMessenger={messenger ?? 'https://m.me/cocobebe.vn'}
        openHours={hours ?? 'Mở ca 07:30 - 21:00 mỗi ngày. Giao hoa nội thành nhanh.'}
      />

      {/* Bộ sưu tập nổi bật */}
      <section className="section bg-[var(--color-page)]">
        <div className="container">
          <SectionTitle
            label="Bộ sưu tập"
            title="Bó hoa đẹp nhất tuần"
            subtitle="Những bó hoa tuyển chọn, phù hợp làm quà tặng cho gia đình."
            align="center"
          />
          <Cards cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {featured.length > 0 ? (
              featured.map((p) => <ProductCard key={p.id} product={p} showBadge={false} />)
            ) : (
              <p className="col-span-full text-center text-sm text-[var(--color-ink-light)]">
                Hiện chưa có sản phẩm nổi bật.
              </p>
            )}
          </Cards>
          <div className="col-span-full flex justify-center py-8">
            <Link href="/bo-suu-tap" className="btn btn-primary">
              Xem tất cả
            </Link>
          </div>
        </div>
      </section>

      {/* Giới thiệu */}
      <section className="section bg-[var(--color-tag-bg)]">
        <div className="container">
          <SectionTitle
            label="Giới thiệu"
            title="VÌ SAO CHỌN COBECUBE"
            subtitle="Làm hoa từ sơ sở yêu thương, giao hoa nhanh như gió."
            align="center"
          />
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {ABOUT_BLOCKS.map((b, i) => (
              <article key={i} className="bg-white rounded-xl p-6 shadow-[var(--shadow-card)]">
                <h3 className="text-lg font-[var(--font-display)] font-bold text-[var(--color-ink)] mb-2">{b.title}</h3>
                <p className="text-sm text-[var(--color-ink-light)]">{b.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Đánh giá khách hàng */}
      <Testimonials reviews={reviews} subtitle="Mỗi sự bó hoa, giúp người." />

      {/* Liên hệ */}
      <section className="section bg-[var(--color-page)]">
        <div className="container">
          <SectionTitle
            label="Liên hệ"
            title="THÔNG TIN LIÊN HỆ"
            subtitle="Bạn cần hoa gấp? Gửi yêu cầu qua Zalo hoặc Messenger."
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 rounded-xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h3 className="text-lg font-[var(--font-display)] font-bold text-[var(--color-ink)]">Địa chỉ</h3>
              <p className="text-sm text-[var(--color-ink-light)]">123 Nguyễn Thị Định, Quận 7, TP. Hồ Chí Minh</p>
              <h3 className="text-lg font-[var(--font-display)] font-bold text-[var(--color-ink)]">Điện thoại</h3>
              <p className="text-sm text-[var(--color-ink-light)]">{phone ?? '0905.888.123'}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-primary)] p-8 text-center text-white">
              <h3 className="text-2xl font-[var(--font-display)] font-bold mb-3">Đặt hoa ngay</h3>
              <p className="text-white/92 mb-6 text-lg">Bất cứ lúc nào, online phục vụ tận nơi.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={zalo ?? 'https://zalo.me/0905888123'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[2.85rem] px-6 rounded-full bg-white text-[var(--color-primary)] hover:bg-white/90 font-semibold transition-colors"
                >
                  Zalo OA
                </a>
                <a
                  href={messenger ?? 'https://m.me/cocobebe.vn'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[2.85rem] px-6 rounded-full bg-white text-[var(--color-primary)] hover:bg-white/90 font-semibold transition-colors"
                >
                  Messenger
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Newsletter title="Đăng ký nhận tin mới" subtitle="Nhận biệt danh miễn phí mỗi tuần." />
    </>
  )
}



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
  title: 'Trang chủ | Shop Flower - Hoa tươi trọn niềm vui',
  description: 'Tiệm Hoa Shop Flower - hoa tươi, hoa cưới, quà tặng giao nhanh tại TP. Hồ Chí Minh.',
}

/** Ảnh nền dự phòng khi gallery chưa có ảnh (URL đã kiểm tra còn sống). */
const FALLBACK_HERO_IMAGE = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1920&q=80'

const ABOUT_BLOCKS = [
  {
    title: 'Hoa tươi chọn lọc mỗi ngày',
    text: 'Mỗi sáng khu vườn chọn những bó hoa mới nhất — tươi, đẹp và giữ được độ bền khi tới tay bạn.',
  },
  {
    title: 'Đặt hoa trong vài phút',
    text: 'Nhắn Zalo hoặc Messenger để chốt mẫu; shop tư vấn màu sắc, lời chúc và giao đúng giờ bạn mong muốn.',
  },
  {
    title: 'Giao nhanh, chu đáo',
    text: 'Nội thành TP. Hồ Chí Minh nhận hoa trong ngày, đóng gói chỉn chu và thay hoa mới nếu chưa hài lòng.',
  },
]

export default async function HomePage() {
  const [gallery, featured, reviews] = await Promise.all([
    getGalleryImages(),
    getFeaturedProducts(9),
    getReviews(6),
  ])

  const [zalo, messenger, phone, hours, address, email, heroTitle, heroSubtitle, heroImageRaw, heroPanelCountRaw, heroEnabledRaw] = await Promise.all([
    getSetting('zalo_link'),
    getSetting('messenger_link'),
    getSetting('phone'),
    getSetting('business_hours'),
    getSetting('address'),
    getSetting('email'),
    getSetting('shop_hero_title'),
    getSetting('shop_hero_subtitle'),
    getSetting('shop_hero_image_url'),
    getSetting('hero_panel_count'),
    getSetting('shop_hero_enabled'),
  ])

  // Cờ bật/tắt hero: mặc định BẬT khi chưa cấu hình (giá trị '' hoặc thiếu).
  const heroEnabled = !['0', 'false', 'off', 'no', 'hidden'].includes(heroEnabledRaw.trim().toLowerCase())

  // Ảnh nền: ưu tiên cài đặt riêng → ảnh đầu thư viện → ảnh dự phòng.
  const heroImage = heroImageRaw || gallery[0]?.url || FALLBACK_HERO_IMAGE

  // Số ảnh decor hero: cho phép 2–5, giá trị lạ → mặc định 3.
  const heroPanelCount = Math.min(5, Math.max(2, Number(heroPanelCountRaw) || 3))
  // Ảnh decor lấy từ gallery. Nếu nền là ảnh riêng thì dùng cả thư viện; nếu
  // nền là gallery[0] thì bỏ ảnh đầu để tránh trùng với nền.
  const heroPanelImages = (heroImageRaw ? gallery : gallery.slice(1))
    .slice(0, heroPanelCount)
    .map((g) => ({ url: g.url, alt: g.alt }))

  const contactRows = [
    { label: 'Địa chỉ', value: address || '123 Nguyễn Thị Định, Quận 7, TP. Hồ Chí Minh' },
    { label: 'Điện thoại', value: phone || '0905.888.123' },
    { label: 'Email', value: email || 'hello@shopflower.vn' },
    { label: 'Giờ mở cửa', value: hours || 'Thứ Hai - Chủ Nhật: 08:00 - 21:00' },
  ]

  return (
    <>
      {heroEnabled ? (
        <Hero
          title={heroTitle || 'Bó hoa đẹp cho bạn yêu thương'}
          subtitle={heroSubtitle || 'Những bó hoa được chọn lọc trong ngày'}
          eyebrow="Xem Online — Hoa gửi tận tay"
          bgImage={heroImage}
          bgAlt="Bó hoa tươi xanh"
          panelImages={heroPanelImages}
          panelCount={heroPanelCount}
          ctaZalo={zalo || 'https://zalo.me/0905888123'}
          ctaMessenger={messenger || 'https://m.me/shopflower.vn'}
          openHours={hours || 'Mở cửa 07:30 - 21:00 mỗi ngày. Giao hoa nội thành nhanh.'}
        />
      ) : null}

      {/* Bộ sưu tập nổi bật */}
      <section className="section bg-[var(--color-page)]">
        <div className="container">
          <SectionTitle
            label="Bộ sưu tập"
            title="Bó hoa đẹp nhất tuần"
            subtitle="Những bó hoa tuyển chọn, phù hợp làm quà tặng cho gia đình và người thương."
            align="center"
          />
          <Cards
            cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            footer={
              <Link href="/bo-suu-tap" className="btn btn-primary">
                Xem tất cả bó hoa
              </Link>
            }
          >
            {featured.length > 0 ? (
              featured.map((p) => <ProductCard key={p.id} product={p} showBadge={false} />)
            ) : (
              <p className="col-span-full text-center text-sm text-[var(--color-ink-light)]">
                Hiện chưa có sản phẩm nổi bật.
              </p>
            )}
          </Cards>
        </div>
      </section>

      {/* Giới thiệu */}
      <section className="section bg-[var(--color-tag-bg)]">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="lg:col-span-5">
              <SectionTitle
                label="Giới thiệu"
                title="Vì sao chọn Shop Flower"
                subtitle="Chúng tôi làm hoa bằng sự tận tâm, giao hoa bằng sự tử tế."
                align="left"
              />
              <Link href="/gioi-thieu" className="btn btn-primary mt-2">
                Câu chuyện của tiệm
              </Link>
            </div>

            <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] lg:col-span-7">
              {ABOUT_BLOCKS.map((block, index) => (
                <li key={index} className="flex items-start gap-5 py-6 first:pt-0 last:pb-0">
                  <span className="font-[var(--font-display)] text-3xl font-semibold leading-none text-[var(--color-primary)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="mb-1 text-[var(--color-ink)]">{block.title}</h3>
                    <p className="text-sm leading-relaxed text-[var(--color-ink-light)]">{block.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Đánh giá khách hàng */}
      <Testimonials
        reviews={reviews}
        subtitle="Mỗi bó hoa là một lời chúc yêu thương. Gửi hoa, gửi niềm tin — chúng tôi giao tận tay, chu đáo từ A đến Z."
      />

      {/* Liên hệ */}
      <section className="section bg-[var(--color-page)]">
        <div className="container">
          <SectionTitle
            label="Liên hệ"
            title="Đặt hoa chỉ với một tin nhắn"
            subtitle="Bạn cần hoa gấp? Gửi yêu cầu qua Zalo hoặc Messenger, shop phản hồi ngay trong giờ làm việc."
            align="center"
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="rounded-3xl border border-[var(--color-border)] bg-white p-8 shadow-[var(--shadow-card)] lg:col-span-3">
              <h3 className="mb-6 text-[var(--color-ink)]">Ghé thăm tiệm hoa</h3>
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                {contactRows.map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">{row.label}</dt>
                    <dd className="mt-1 text-sm text-[var(--color-ink-light)]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col justify-center rounded-3xl bg-[var(--color-primary)] p-8 text-center text-white shadow-[var(--shadow-card)] lg:col-span-2">
              <h3 className="mb-2 text-2xl text-white">Đặt hoa ngay</h3>
              <p className="mb-6 text-white/90">Bất cứ lúc nào, chúng tôi phục vụ tận nơi.</p>
              <div className="flex flex-col gap-3">
                <a
                  href={zalo || 'https://zalo.me/0905888123'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-white text-[var(--color-primary)] hover:bg-white/90"
                >
                  Nhắn Zalo OA
                </a>
                <a
                  href={messenger || 'https://m.me/shopflower.vn'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn border-white/60 bg-transparent text-white hover:bg-white/10"
                >
                  Nhắn Messenger
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Newsletter title="Đăng ký nhận tin mới" subtitle="Nhận bí quyết chọn hoa và ưu đãi mới mỗi tuần." />
    </>
  )
}

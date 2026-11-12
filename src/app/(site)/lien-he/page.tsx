/**
 * Trang liên hệ `/lien-he`: bản đồ, thông tin cửa hàng, đường đến bằng
 * xe, các nút đặt hoa nhanh (Zalo / Messenger / gọi điện).
 */
import { SectionTitle } from '@/components/site/SectionTitle'
import { getSetting } from '@/lib/getProducts'

export const metadata = {
  title: 'Liên hệ | CoBeCuBe - Hoa tươi',
  description: 'Liên hệ đặt hoa - Tiệm Hoa CoBeCuBe. Hoa tươi, hoa cưới, quà tặng giao nhanh.',
}

export default async function LienHePage() {
  const [phone, address, businessHours, email, zaloLink, messengerLink, facebookLink, instagramLink] =
    await Promise.all([
      getSetting('phone'),
      getSetting('address'),
      getSetting('business_hours'),
      getSetting('email'),
      getSetting('zalo_link'),
      getSetting('messenger_link'),
      getSetting('facebook_link'),
      getSetting('instagram_link'),
    ])

  return (
    <main className="min-h-screen bg-[var(--color-page)]">
      <section className="section">
        <div className="container">
          <SectionTitle
            label="Liên hệ"
            title="Đặt hoa chỉ với một tin nhắn"
            subtitle="Giao diện nhanh qua điện thoại, Zalo hoặc Messenger, chúng tôi sẽ gọi lại cho bạn."
            align="center"
          />

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {/* Bản đồ */}
            <div className="rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.592708650099!2d106.7898517!3d10.8157!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDQ5JzEkLjAiTiAxMDZDbzQ3JzQzLjAiRQ!5e0!3m2!1sVi!2sVN!4v1700000000000!5m2!1sVi!2sVN"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer"
                title="Bản đồ tiệm hoa CoBeCuBe"
                className="w-full h-full min-h-[320px] sm:min-h-[400px]"
              />
            </div>

            {/* Thông tin */}
            <div className="space-y-6">
              <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] space-y-4">
                <h2 className="text-lg font-[var(--font-display)] font-medium text-[var(--color-ink)]">
                  Thông tin cửa hàng
                </h2>
                <div className="space-y-3 text-sm text-[var(--color-ink-light)]">
                  <p>
                    <span className="font-medium text-[var(--color-ink)]">Địa chỉ:</span>{' '}
                    {address ?? '123 Nguyễn Thị Định, Phường Nguyễn Cư Trinh, Quận 7, TP. Hồ Chí Minh'}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--color-ink)]">Điện thoại:</span>{' '}
                    <a href={`tel:${phone ?? '0905888123'}`} className="hover:text-[var(--color-primary)]">
                      {phone ?? '0905.888.123'}
                    </a>
                  </p>
                  <p>
                    <span className="font-medium text-[var(--color-ink)]">Email:</span>{' '}
                    <a href={`mailto:${email ?? 'hello@cocobebe.vn'}`} className="hover:text-[var(--color-primary)]">
                      {email ?? 'hello@cocobebe.vn'}
                    </a>
                  </p>
                  <p>
                    <span className="font-medium text-[var(--color-ink)]">Giờ mở cửa:</span> {businessHours}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] space-y-4">
                <h2 className="text-lg font-[var(--font-display)] font-medium text-[var(--color-ink)]">
                  Đặt hoa ngay
                </h2>
                <p className="text-sm text-[var(--color-ink-light)]">
                  Nhắn tin qua Zalo/Messenger để đặt hoa nhanh, shop hỗ trợ phiên online trong giờ làm việc.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={zaloLink ?? 'https://zalo.me/0905888123'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary flex-1 rounded-full"
                  >
                    Zalo OA
                  </a>
                  <a
                    href={messengerLink ?? 'https://m.me/cocobebe.vn'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary flex-1 rounded-full"
                  >
                    Messenger
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
                <h2 className="text-lg font-[var(--font-display)] font-medium text-[var(--color-ink)] text-center">
                  Kết nối chúng tôi
                </h2>
                <div className="mt-4 flex justify-center gap-4">
                  {[facebookLink ?? 'https://facebook.com/cocobebe.vn', instagramLink ?? 'https://instagram.com/cocobebe.vn'].map(
                    (href, i) => (
                      <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[var(--color-tag-bg)] flex items-center justify-center text-[var(--color-primary)] font-bold hover:bg-[var(--color-primary)] hover:text-white transition-colors">
                        {i === 0 ? 'F' : 'I'}
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

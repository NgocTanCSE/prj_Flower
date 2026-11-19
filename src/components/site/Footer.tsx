import Link from 'next/link'

import { getSetting } from '@/lib/getProducts'

import { LogoMark } from '@/components/site/LogoMark'
import { Reveal } from '@/components/site/Reveal'

/** Đọc an toàn một setting (Supabase chưa sẵn, trả về ''). */
async function setting(key: string): Promise<string> {
  try {
    return await getSetting(key)
  } catch {
    return ''
  }
}

/** Footer: thương hiệu + điều hướng + thông tin liên hệ (từ `settings`). */
export async function Footer() {
  const [shopName, shopAddress, shopPhone, shopEmail, shopHours, zalo, messenger, facebook, instagram] =
    await Promise.all([
      setting('shop_name'),
      setting('address'),
      setting('phone'),
      setting('email'),
      setting('business_hours'),
      setting('zalo_link'),
      setting('messenger_link'),
      setting('facebook_link'),
      setting('instagram_link'),
    ])

  const brand = shopName || 'Shop Flower'
  const nav = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Bộ sưu tập', href: '/bo-suu-tap' },
    { label: 'Giới thiệu', href: '/gioi-thieu' },
    { label: 'Liên hệ', href: '/lien-he' },
  ]

  const social = [
    { href: zalo, label: 'Zalo', char: 'Z' },
    { href: messenger, label: 'Messenger', char: 'M' },
    { href: facebook, label: 'Facebook', char: 'f' },
    { href: instagram, label: 'Instagram', char: 'I' },
  ].filter((s) => s.href !== '')

  return (
    <footer className="bg-[#1a1a1a] text-white/80 transition-colors duration-300">
      <div className="container py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Cột 1: brand */}
          <Reveal delay={0}>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="text-[var(--color-primary-light)]" aria-hidden="true">
                  <LogoMark size={26} />
                </span>
                <h3 className="font-[var(--font-display)] font-bold text-white leading-tight">{brand}</h3>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                {shopHours !== '' ? shopHours : 'Thứ Hai - Chủ Nhật: 08:00 - 21:00'}
              </p>
              <p className="text-sm text-white/70">{shopPhone !== '' ? shopPhone : '0905.888.123'}</p>
            </div>
          </Reveal>

          {/* Cột 2: điều hướng */}
          <Reveal delay={60}>
            <div className="space-y-3">
              <h4 className="uppercase tracking-widest text-white/50">Điều hướng</h4>
              <ul className="space-y-2 text-sm">
                {nav.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="inline-block transition-colors hover:text-white">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Cột 3: dịch vụ */}
          <Reveal delay={120}>
            <div className="space-y-3">
              <h4 className="uppercase tracking-widest text-white/50">Dịch vụ</h4>
              <ul className="space-y-2 text-sm">
                <li>Hoa sinh nhật</li>
                <li>Hoa cưới</li>
                <li>Hoa chia buồn</li>
                <li>Hoa trang trí</li>
                <li>Quà tặng</li>
              </ul>
            </div>
          </Reveal>

          {/* Cột 4: xã hội */}
          <Reveal delay={180}>
            <div className="space-y-4">
              <h4 className="uppercase tracking-widest text-white/50">Kênh liên hệ</h4>
              <div className="flex gap-3">
                {social.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold transition-colors hover:bg-white/20"
                  >
                    {s.char}
                  </a>
                ))}
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                {shopAddress !== '' ? shopAddress : '123 Nguyễn Thị Định, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh'}
              </p>
              <p className="text-sm text-white/70">{shopEmail !== '' ? shopEmail : 'hello@shopflower.vn'}</p>
            </div>
          </Reveal>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 text-center text-xs text-white/50">
          &copy; {new Date().getFullYear()} {brand}. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  )
}

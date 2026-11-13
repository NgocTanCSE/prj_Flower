import Link from 'next/link'

import { getSetting } from '@/lib/getProducts'

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

  const brand = shopName || 'CoBeCuBe'
  const nav = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Bộ sưu tập', href: '/bo-suu-tap' },
    { label: 'Giới thiệu', href: '/gioi-thieu' },
    { label: 'Liên hệ', href: '/lien-he' },
  ]

  return (
    <footer className="bg-[#1a1a1a] text-white/85">
      <div className="container py-10 sm:py-12 md:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Cột 1: brand */}
          <div className="space-y-3">
            <h3 className="text-xl font-[var(--font-display)] font-bold text-white">{brand}</h3>
            <p className="text-sm text-white/70">
              {shopHours !== '' ? `${shopHours}` : 'Thứ Bảy - Chủ Nhật: 08:00 - 21:00'}
            </p>
            <p className="text-sm text-white/70">{shopPhone !== '' ? shopPhone : '0905.888.123'}</p>
          </div>

          {/* Cột 2: điều hướng */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium uppercase tracking-widest text-white/50">Điều hướng</h4>
            <ul className="space-y-2 text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="hover:text-white">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: dịch vụ */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium uppercase tracking-widest text-white/50">Dịch vụ</h4>
            <ul className="space-y-2 text-sm">
              <li>Hoa sinh nhật</li>
              <li>Hoa cưới</li>
              <li>Hoa chia buồn</li>
              <li>Hoa trang trí</li>
              <li>Quà tặng</li>
            </ul>
          </div>

          {/* Cột 4: xã hội */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium uppercase tracking-widest text-white/50">Kênh liên hệ</h4>
            <div className="flex gap-4">
              {zalo !== '' && (
                <a href={zalo} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors">
                  Z
                </a>
              )}
              {messenger !== '' && (
                <a href={messenger} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors">
                  M
                </a>
              )}
              {facebook !== '' && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors">
                  f
                </a>
              )}
              {instagram !== '' && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors">
                  I
                </a>
              )}
            </div>
            <p className="text-sm text-white/70">
              {shopAddress !== '' ? shopAddress : '123 Nguyễn Thị Định, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh'}
            </p>
            <p className="text-sm text-white/70">
              {shopEmail !== '' ? shopEmail : 'hello@cocobebe.vn'}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/50">
          {shopAddress !== '' && (
            <>
              {shopAddress}
              <br />
            </>
          )}
          &copy; {new Date().getFullYear()} {brand}. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  )
}

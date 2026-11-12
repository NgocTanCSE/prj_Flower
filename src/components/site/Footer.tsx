import Link from 'next/link'

/** Chốt chánh: số thoại, Zalo, Messenger, địa chỉ, bản đồ, giờ mở cửa, social. */
const INFO = {
  shopName: 'Tiệm Hoa CoBeCuBe',
  address: '123 Nguyễn Thị Định, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh',
  phone: '0905.888.123',
  email: 'hello@cocobebe.vn',
  businessHours: 'Thứ Hai - Chủ Nhật: 08:00 - 21:00',
  zalo: 'https://zalo.me/0905888123',
  messenger: 'https://m.me/cocobebe.vn',
  facebook: 'https://facebook.com/cocobebe.vn',
  instagram: 'https://instagram.com/cocobebe.vn',
}

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white/85">
      <div className="container py-10 sm:py-12 md:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Cột 1: brand */}
          <div className="space-y-3">
            <h3 className="text-xl font-[var(--font-display)] font-bold text-white">CoBeCuBe</h3>
            <p className="text-sm text-white/70">
              Hoa tươi mỗi ngày, trao gửi yêu thương.iu yêu từ những bó hoa tinh khôi.
            </p>
            <p className="text-sm text-white/70">{INFO.phone}</p>
          </div>

          {/* Cột 2: điều hướng */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium uppercase tracking-widest text-white/50">Điều hướng</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/bo-suu-tap" className="hover:text-white">
                  Bộ sưu tập
                </Link>
              </li>
              <li>
                <Link href="/gioi-thieu" className="hover:text-white">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/lien-he" className="hover:text-white">
                  Liên hệ
                </Link>
              </li>
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
              <a href={INFO.zalo} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors">
                Z
              </a>
              <a href={INFO.messenger} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors">
                M
              </a>
              <a href={INFO.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors">
                f
              </a>
              <a href={INFO.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold hover:bg-white/20 transition-colors">
                I
              </a>
            </div>
            <p className="text-sm text-white/70">{INFO.businessHours}</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/50">
          {INFO.address}
          <br />
          &copy; {new Date().getFullYear()} CoBeCuBe. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  )
}

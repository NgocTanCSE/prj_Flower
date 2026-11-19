'use client';

import Image from 'next/image';
import Link from 'next/link';

export interface HeroPanelImage {
  url: string;
  alt?: string;
}

interface HeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  bgImage: string;
  bgAlt?: string;
  /** Ảnh decor panel (lấy từ gallery, bỏ qua ảnh chính). */
  panelImages?: HeroPanelImage[];
  /** Số ảnh panel hiển thị: 2–5, mặc định 3. */
  panelCount?: number;
  ctaZalo?: string;
  ctaMessenger?: string;
  openHours?: string;
}

/** Số lượng panel tối thiểu/tối đa cho phép. */
const PANEL_MIN = 2;
const PANEL_MAX = 5;
const PANEL_DEFAULT = 3;

export function Hero({
  title,
  subtitle,
  eyebrow,
  bgImage,
  bgAlt,
  panelImages = [],
  panelCount,
  ctaZalo,
  ctaMessenger,
  openHours,
}: HeroProps) {
  const ORDER_MSG = [
    'Xin',
    'ch\u00e0o',
    'Ti\u1ec7m',
    'Hoa',
    'Shop Flower,',
    'm\u00ecnh',
    'mu\u1ed1n',
    '\u0111\u1eb5t',
    'hoa.',
  ].join(' ');
  if (ctaZalo === undefined) ctaZalo = 'https://zalo.me/0901234567?text=' + encodeURIComponent(ORDER_MSG);
  if (ctaMessenger === undefined) ctaMessenger = 'https://m.me/tiemhoashopflower?text=' + encodeURIComponent(ORDER_MSG);
  if (subtitle === undefined) subtitle = 'Những bó hoa được chọn lọc trong ngày, gói ghém tình tế và giao tận tay.';
  if (openHours === undefined) openHours = 'Mở cả 07:30 - 21:00 mỗi ngày. Giao hoa nội thành nhanh.';

  // Clamp số lượng panel hiển thị (cài đặt lỗi → dùng mặc định).
  const count = Math.min(PANEL_MAX, Math.max(PANEL_MIN, panelCount ?? PANEL_DEFAULT));
  const shown = panelImages.slice(0, count);

  return (
    <section className="hero relative min-h-[min(100svh,50rem)] flex items-center overflow-clip text-white">
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt={bgAlt !== undefined ? bgAlt : 'hoa tươi'}
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(53,37,39,0.72)_0%,rgba(53,37,39,0.46)_42%,rgba(53,37,39,0.22)_100%),linear-gradient(180deg,rgba(53,37,39,0.12)_0%,rgba(53,37,39,0.35)_100%)]"></div>
      </div>

      {/* Décor mờ nhẹ cho chiều sâu */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="hero-glow hero-glow--1"></span>
        <span className="hero-glow hero-glow--2"></span>
      </div>

      {/* ---- Bộ ảnh decor (số lượng cấu hình, lấy từ gallery) ---- */}
      {shown.length >= PANEL_MIN ? (
        <>
          {/* Desktop: chồng lên nhau, góc phải-dưới. */}
          <div className="pointer-events-none absolute right-8 bottom-8 z-10 hidden flex-col-reverse items-center gap-[16px] md:flex">
            {shown.map((img, i) => (
              <PanelImage
                key={`${img.url}-${i}`}
                url={img.url}
                alt={img.alt}
                desktop
                style={{ animationDelay: `${220 + i * 85}ms` }}
              />
            ))}
          </div>
          {/* Mobile: strip ảnh ngang phía dưới. */}
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex gap-2 md:hidden">
            {shown.map((img, i) => (
              <div key={`${img.url}-${i}`} className="flex-1 animate-panel-up" style={{ animationDelay: `${200 + i * 80}ms` }}>
                <PanelImage url={img.url} alt={img.alt} />
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="container relative z-[1] mx-auto">
        {/* pb-24 ở mobile: tránh chồng lên strip ảnh phía dưới. */}
        <div className="max-w-2xl hero-anim pb-24 md:pb-0">
          {eyebrow !== undefined && (
            <div className="mb-4 inline-block rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-semibold tracking-0.01em hero-anim" style={{ animationDelay: '80ms' }}>
              {eyebrow}
            </div>
          )}
          <h1 className="mb-5 text-white leading-[1.04] hero-anim" style={{ animationDelay: '160ms' }}>{title}</h1>
          <p className="mb-8 text-lg text-white/90 max-w-xl hero-anim" style={{ animationDelay: '240ms' }}>{subtitle}</p>
          <div className="mb-5 flex flex-wrap gap-3 hero-anim" style={{ animationDelay: '320ms' }}>
            <a
              href={ctaZalo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[2.85rem] px-6 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold transition-colors shadow-[0_10px_24px_rgba(169,87,109,0.22)]"
            >
              <span className="inline-flex items-center justify-center w-[1.45rem] h-[1.45rem] rounded-full bg-white/20 text-[0.82rem] font-bold">
                Z
              </span>
              Đặt qua Zalo
            </a>
            <Link
              href={ctaMessenger}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[2.85rem] px-6 rounded-full bg-white/90 hover:bg-white text-[var(--color-primary-dark)] font-semibold transition-colors shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
            >
              <span className="inline-flex items-center justify-center w-[1.45rem] h-[1.45rem] rounded-full bg-[var(--color-tag-bg)] text-[0.82rem] font-bold text-[var(--color-primary)]">
                M
              </span>
              Nhắn Messenger
            </Link>
          </div>
          <p className="m-0 text-white/80 text-sm hero-anim" style={{ animationDelay: '400ms' }}>{openHours}</p>
        </div>
      </div>
    </section>
  );
}

/** Một ảnh trong bộ decor: viền trắng mờ, bóng mềm, nhấn nhẹ khi hover. */
function PanelImage({ url, alt, desktop, style }: { url: string; alt?: string; desktop?: boolean; style?: React.CSSProperties }) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border bg-white/30
        shadow-[0_8px_24px_rgba(92,58,64,0.18)]
        transition-transform duration-500 hover:scale-[1.04]
        animate-panel-up
        ${desktop ? 'h-[92px] w-[92px] md:h-[98px] md:w-[98px]' : 'aspect-[4/3]'}
      `}
      style={style}
    >
      <Image src={url} alt={alt || 'Ảnh bó hoa'} fill className="object-cover" sizes={desktop ? '98px' : '25vw'} />
    </div>
  );
}

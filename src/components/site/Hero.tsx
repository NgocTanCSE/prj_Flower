'use client';

import Image from 'next/image';
import Link from 'next/link';

interface HeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  bgImage: string;
  bgAlt?: string;
  ctaZalo?: string;
  ctaMessenger?: string;
  openHours?: string;
}

export function Hero({
  title,
  subtitle,
  eyebrow,
  bgImage,
  bgAlt,
  ctaZalo,
  ctaMessenger,
  openHours,
}: HeroProps) {
  const ORDER_MSG = [
    'Xin',
    'ch\u00e0o',
    'Ti\u1ec7m',
    'Hoa',
    'CoBeCuBe,',
    'm\u00ecnh',
    'mu\u1ed1n',
    '\u0111\u1eb5t',
    'hoa.',
  ].join(' ');
  if (ctaZalo === undefined) ctaZalo = 'https://zalo.me/0901234567?text=' + encodeURIComponent(ORDER_MSG);
  if (ctaMessenger === undefined) ctaMessenger = 'https://m.me/tiemhoacobecube?text=' + encodeURIComponent(ORDER_MSG);
  if (subtitle === undefined) subtitle = 'Nhung bo hoa duoc chon lua trong ngay, goi gem tinh te va giao tan tay.';
  if (openHours === undefined) openHours = 'Mo ca 07:30 - 21:00 moi ngay. Giao hoa noi thanh nhanh.';

  return (
    <section className="hero relative min-h-[min(100dvh,48rem)] flex items-center overflow-clip text-white">
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

      <div className="container relative z-[1] px-6 sm:px-8 md:px-10">
        <div className="max-w-2xl">
          {eyebrow !== undefined && (
            <div className="mb-3 inline-block rounded-full bg-white/16 border border-white/22 px-3 py-1.5 text-sm font-semibold tracking-0.01em">
              {eyebrow}
            </div>
          )}
          <h1 className="mb-4 text-white text-4xl">{title}</h1>
          <p className="mb-6 text-[clamp(1.02rem,0.98rem+0.4vw,1.18rem)] text-white/92">{subtitle}</p>
          <div className="mb-4 flex flex-wrap gap-3">
            <a
              href={ctaZalo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[2.85rem] px-6 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold transition-colors shadow-[0_10px_24px_rgba(169,87,109,0.22)]"
            >
              <span className="inline-flex items-center justify-center w-[1.45rem] h-[1.45rem] rounded-full bg-white/22 text-[0.82rem] font-bold">
                Z
              </span>
              Đặt qua Zalo
            </a>
            <a
              href={ctaMessenger}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[2.85rem] px-6 rounded-full bg-white/92 hover:bg-white text-[var(--color-primary-dark)] font-semibold transition-colors"
            >
              <span className="inline-flex items-center justify-center w-[1.45rem] h-[1.45rem] rounded-full bg-white/22 text-[0.82rem] font-bold">
                M
              </span>
              Nhắn Messenger
            </a>
          </div>
          <p className="m-0 text-white/84 text-[0.95rem]">{openHours}</p>
        </div>
      </div>
    </section>
  );
}

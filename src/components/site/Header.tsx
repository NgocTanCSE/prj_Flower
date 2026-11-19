'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogoMark } from '@/components/site/LogoMark'

interface HeaderProps {
  shopName?: string
  logoUrl?: string
  ctaZalo?: string
  ctaMessenger?: string
  phone?: string
}

const INVALID_LOGO_MARKERS = ['credly', 'placeholder', 'example.com']

/** Ảnh logo từ DB hợp lệ hay dùng fallback SVG (vd: ảnh placeholder).
 *  Type guard: nếu trả về `true` thì `url` chắc chắn là string hợp lệ. */
function isValidLogo(url?: string): url is string {
  if (!url || url.trim() === '') return false
  const lower = url.toLowerCase()
  return !INVALID_LOGO_MARKERS.some((m) => lower.includes(m))
}

/** Giá trị setting đã trim, hoặc fallback khi rỗng. */
function orFallback(value: string | undefined, fallback: string): string {
  return value && value.trim() !== '' ? value.trim() : fallback
}

export function Header({ shopName, logoUrl, ctaZalo, ctaMessenger, phone }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [ctaOpen, setCtaOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const shop = shopName || 'Shop Flower'
  const phoneDigits = (phone || '0905888123').replace(/[^0-9]/g, '')

  const ZaloMessage = `Xin chào ${shop}, mình muốn đặt hoa.`
  const zalo = orFallback(ctaZalo, `https://zalo.me/${phoneDigits}?text=${encodeURIComponent(ZaloMessage)}`)
  const messenger = orFallback(ctaMessenger, 'https://m.me/shopflower.vn')

  const nav = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Bộ sưu tập', href: '/bo-suu-tap' },
    { label: 'Giới thiệu', href: '/gioi-thieu' },
    { label: 'Liên hệ', href: '/lien-he' },
  ]

  /** Trang hiện tại có khớp mục điều hướng không. */
  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Chuyển trang thì đóng menu/dropdown.
  useEffect(() => {
    setMenuOpen(false)
    setCtaOpen(false)
  }, [pathname])

  // Đóng dropdown "Đặt hoa" khi bấm ra ngoài hoặc nhấn Escape.
  useEffect(() => {
    if (!ctaOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (ctaRef.current && !ctaRef.current.contains(event.target as Node)) {
        setCtaOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCtaOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ctaOpen])

  return (
    <header
      ref={headerRef}
      className={`header sticky top-0 z-50 bg-white/95 border-b border-[var(--color-border)] backdrop-blur-sm ${scrolled ? 'is-scrolled' : ''}`}
    >
      <div className="container flex items-center justify-between h-[var(--header-height)]">
        <Link href="/" className="flex items-center gap-2">
          {isValidLogo(logoUrl) ? (
            <Image src={logoUrl} alt={shop} width={28} height={28} className="rounded-full" />
          ) : (
            <span className="text-[var(--color-primary)]" aria-hidden="true">
              <LogoMark size={28} />
            </span>
          )}
          <span className="text-xl sm:text-2xl font-[var(--font-display)] font-bold text-[var(--color-ink)] leading-tight">{shop}</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden w-11 h-11 rounded-full border border-[var(--color-border)] flex flex-col justify-center items-center gap-0.5 bg-white transition-colors hover:bg-[var(--color-tag-bg)]"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
        >
          <span className={`block w-5 h-0.5 bg-[var(--color-ink)] rounded transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`h-0.5 bg-[var(--color-ink)] rounded transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-[var(--color-ink)] rounded transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>

        <nav className="hidden md:flex gap-1">
          {nav.map((n) => {
            const active = isActive(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`group relative block px-4 py-3 text-sm transition-colors ${
                  active ? 'font-semibold text-[var(--color-primary)]' : 'text-[var(--color-ink)] hover:text-[var(--color-primary)]'
                }`}
              >
                {n.label}
                <span
                  className={`absolute inset-x-4 bottom-1.5 h-0.5 origin-left rounded-full bg-[var(--color-primary)] transition-transform duration-200 ${
                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                  aria-hidden="true"
                />
              </Link>
            )
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <div className="relative" ref={ctaRef}>
            <button
              type="button"
              onClick={() => setCtaOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={ctaOpen}
              aria-controls="cta-menu"
              className="inline-flex items-center justify-center gap-2 min-h-[2.85rem] px-6 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold transition-colors shadow-[0_10px_24px_rgba(169,87,109,0.22)]"
            >
              Đặt hoa
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${ctaOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              id="cta-menu"
              role="menu"
              aria-label="Chọn kênh đặt hoa"
              className={`absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-[0_18px_44px_rgba(92,58,64,0.16)] transition-all duration-150 ${
                ctaOpen ? 'visible scale-100 opacity-100' : 'invisible pointer-events-none scale-95 opacity-0'
              }`}
            >
              <a
                role="menuitem"
                href={zalo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCtaOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--color-tag-bg)]"
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                  Z
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--color-ink)]">Đặt qua Zalo</span>
                  <span className="block text-xs text-[var(--color-ink-light)]">Nhắn tin nhanh, shop trả lời ngay</span>
                </span>
              </a>

              <a
                role="menuitem"
                href={messenger}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCtaOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--color-tag-bg)]"
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#e8f2ff] text-sm font-bold text-[#0084ff]">
                  M
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--color-ink)]">Nhắn Messenger</span>
                  <span className="block text-xs text-[var(--color-ink-light)]">Gửi mẫu hoa, tư vấn trực tiếp</span>
                </span>
              </a>

              <Link
                role="menuitem"
                href="/lien-he"
                onClick={() => setCtaOpen(false)}
                className="mt-1 flex items-center gap-3 rounded-xl border-t border-[var(--color-border)] px-3 pb-1 pt-3 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
              >
                Xem trang liên hệ
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`mobile-menu overflow-hidden ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} md:hidden bg-white border-b border-[var(--color-border)]`}
      >
        <nav className="flex flex-col gap-1 px-4 pb-3 pt-3">
          {nav.map((n) => {
            const active = isActive(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`block px-4 py-3 text-sm rounded-lg transition-colors ${
                  active
                    ? 'bg-[var(--color-tag-bg)] font-semibold text-[var(--color-primary)]'
                    : 'text-[var(--color-ink)] hover:bg-[var(--color-tag-bg)] hover:text-[var(--color-primary)]'
                }`}
              >
                {n.label}
              </Link>
            )
          })}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a href={zalo} target="_blank" rel="noopener noreferrer" className="btn btn-primary border-0">
              Đặt qua Zalo
            </a>
            <a href={messenger} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Nhắn Messenger
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
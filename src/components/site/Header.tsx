'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  shopName?: string
  logoUrl?: string
  ctaZalo?: string
}

export function Header({ shopName, logoUrl, ctaZalo }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const shop = shopName || 'CoBeCuBe'

  const ZaloMessage = `Xin chào ${shop}, mình muốn đặt hoa.`
  const zalo = ctaZalo !== undefined ? ctaZalo : `https://zalo.me/0901234567?text=${encodeURIComponent(ZaloMessage)}`

  const nav = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Bộ sưu tập', href: '/bo-suu-tap' },
    { label: 'Giới thiệu', href: '/gioi-thieu' },
    { label: 'Liên hệ', href: '/lien-he' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-[var(--color-border)] backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between h-[var(--header-height)] px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl !== undefined && logoUrl !== '' ? (
            <Image src={logoUrl} alt={shop} width={24} height={24} className="rounded-full" />
          ) : (
            <svg viewBox="0 0 32 32" width="24" height="24" fill="none" aria-hidden="true" className="text-[var(--color-primary)]">
              <circle cx="16" cy="16" r="4.2" fill="currentColor" opacity="0.9" />
              <ellipse cx="16" cy="7.2" rx="3.2" ry="4.8" fill="currentColor" opacity="0.45" />
              <ellipse cx="16" cy="24.8" rx="3.2" ry="4.8" fill="currentColor" opacity="0.45" />
              <ellipse cx="7.2" cy="16" rx="4.8" ry="3.2" fill="currentColor" opacity="0.45" />
              <ellipse cx="24.8" cy="16" rx="4.8" ry="3.2" fill="currentColor" opacity="0.45" />
            </svg>
          )}
          <span className="text-2xl font-[var(--font-display)] font-bold text-[var(--color-ink)]">{shop}</span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-11 h-11 rounded-full border border-[var(--color-border)] flex flex-col justify-center items-center gap-0.5 bg-white"
          aria-expanded={menuOpen}
          aria-label="Mở menu điều hướng"
        >
          <span className="block w-5 h-0.5 bg-[var(--color-ink)] rounded"></span>
          <span className="block w-5 h-0.5 bg-[var(--color-ink)] rounded"></span>
          <span className="block w-5 h-0.5 bg-[var(--color-ink)] rounded"></span>
        </button>

        <nav className={`hidden md:flex gap-2`}>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="block px-3 py-2 rounded-lg text-sm text-[var(--color-ink)] hover:text-[var(--color-primary)] hover:bg-[var(--color-tag-bg)]">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href={zalo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[2.85rem] px-6 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold transition-colors shadow-[0_10px_24px_rgba(169,87,109,0.22)]"
          >
            Đặt hoa
          </a>
        </div>
      </div>

      <div className={menuOpen ? 'block md:hidden bg-white border-b border-[var(--color-border)]' : 'hidden'}>
        <nav className="flex flex-col gap-2 p-4">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center px-3 py-2 rounded-lg">
              {n.label}
            </Link>
          ))}
          <Link href={zalo} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Đặt hoa
          </Link>
        </nav>
      </div>
    </header>
  )
}

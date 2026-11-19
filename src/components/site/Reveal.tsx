'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Độ trễ xuất hiện (ms), dùng để stagger cho nhóm card. */
  delay?: number
}

/**
 * Wrap phần tử hiển thị khi vào viewport (fade-up).
 * Dùng IntersectionObserver nhẹ, không phụ thuộc thư viện.
 * Nếu người dùng bật "Giảm chuyển động", phần tử hiển thị ngay.
 */
export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  /** Mặc định hiển thị (nội dung không bị mất khi JS lỗi / tắt). */
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    // Ẩn phần tử cho tới khi nó vào viewport.
    setVisible(false)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal${visible ? ' is-visible' : ''} ${className}`.trim()}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

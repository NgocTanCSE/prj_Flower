'use client'

/** ButtonLink – nút dạng `<Link>` dùng Tailwind thuần (được style giống Button primary). */

import Link from 'next/link'

interface ButtonLinkProps {
  href: string
  children: React.ReactNode
}

export function ButtonLink({ href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-lg bg-[#8b5f65] px-4 py-2 text-sm font-medium text-white
        transition-colors hover:bg-[#764f54] active:scale-[0.97]"
    >
      {children}
    </Link>
  )
}

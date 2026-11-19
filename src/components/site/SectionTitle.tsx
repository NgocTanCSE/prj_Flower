'use client';

import type { ReactNode } from 'react';

interface SectionTitleProps {
  label?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  light?: boolean;
  id?: string;
  children?: ReactNode;
}

/**
 * Khối tiêu đề của một section.
 *
 * Căn lề được áp trực tiếp lên khối tiêu đề (không chỉ `align-items`) để
 * tiêu đề/phụ đề căn giữa đúng theo bề rộng trang, thay vì bị kẹt ở lề trái
 * trong một khối `max-width`.
 */
export function SectionTitle({ label, title, subtitle, align = 'left', light = false, id, children }: SectionTitleProps) {
  const alignments: Record<string, string> = {
    left: 'items-start text-left',
    center: 'items-center text-center mx-auto md:items-center',
    right: 'items-end text-right ml-auto',
  };
  const text = light ? 'text-white' : 'text-[var(--color-ink)]';
  const sub = light ? 'text-white/80' : 'text-[var(--color-ink-light)]';

  return (
    <div id={id} className={`section-head flex flex-col gap-3 ${alignments[align]}`}>
      {label !== undefined && <span className="section-label">{label}</span>}
      <h2 className={text}>{title}</h2>
      {subtitle !== undefined && <p className={`w-full text-lg ${sub}`}>{subtitle}</p>}
      {children}
    </div>
  );
}

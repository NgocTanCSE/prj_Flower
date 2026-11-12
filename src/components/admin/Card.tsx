'use client';

/**
 * Card – container thông dụng cho admin dashboard và bảng điều khiển.
 */

import React from 'react';

export type CardVariant = 'white' | 'light' | 'border' | 'shadow';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  as?: 'div' | 'section' | 'article';
}

const variants: Record<CardVariant, string> = {
  white: 'bg-white border border-[#e8e1e1]',
  light: 'bg-[#fdfbfb] border border-[#e8e1e1]',
  border:
    'bg-white border border-[#e8e1e1] shadow-[0_8px_24px_rgba(92,58,64,0.08)]',
  shadow:
    'bg-white border border-[#e8e1e1] shadow-[0_8px_24px_rgba(92,58,64,0.08)]',
};

export function Card({
  variant = 'shadow',
  title,
  subtitle,
  as = 'div',
  className = '',
  children,
  ...rest
}: CardProps) {
  const Tag = as;
  return (
    <Tag className={`rounded-xl p-4 ${variants[variant]} ${className}`} {...rest}>
      {(title || subtitle) && (
        <header className="mb-4 pb-3 border-b border-[#e8e1e1]">
          <h3 className="text-lg font-semibold text-[#1a1a1a]">{title}</h3>
          {subtitle && <p className="text-sm text-[#5b5b5b]">{subtitle}</p>}
        </header>
      )}
      {children}
    </Tag>
  );
}

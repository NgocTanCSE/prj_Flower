'use client';

import type { ReactNode } from 'react';

interface SectionTitleProps {
  label?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  light?: boolean;
  id?: string;
}

export function SectionTitle({ label, title, subtitle, align = 'left', light = false, id }: SectionTitleProps) {
  const aligns: Record<string, string> = {
    left: 'md:items-start',
    center: 'md:items-center',
    right: 'md:items-end',
  };
  const text = light ? 'text-white' : 'text-[var(--color-ink)]';
  const sub = light ? 'text-white/80' : 'text-[var(--color-ink-light)]';

  return (
    <div id={id} className={`section-head flex flex-col gap-3 ${aligns[align]}`}>
      {label !== undefined && (
        <span className="text-sm font-medium uppercase tracking-widest text-center">{label}</span>
      )}
      <h2 className={`text-4xl ${text}`}>{title}</h2>
      {subtitle !== undefined && <p className={`text-lg ${sub}`}>{subtitle}</p>}
    </div>
  );
}

'use client';

import { Children, type ReactNode } from 'react';

import { Reveal } from '@/components/site/Reveal';

interface CardsProps {
  children: ReactNode;
  cols?: string;
  footer?: ReactNode;
  className?: string;
  /** Độ trễ giữa các card khi hiện (ms). Mặc định 70ms. */
  stagger?: number;
}

export function Cards({ children, cols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', footer, className = '', stagger = 70 }: CardsProps) {
  return (
    <div className={className}>
      <div className={`grid ${cols} gap-5`}>
        {Children.map(children, (child, i) =>
          child !== null && child !== undefined ? (
            <Reveal key={i} delay={i * stagger} className="h-full">
              {child}
            </Reveal>
          ) : null,
        )}
      </div>
      {footer !== undefined && <div className="col-span-full flex justify-center py-8">{footer}</div>}
    </div>
  );
}

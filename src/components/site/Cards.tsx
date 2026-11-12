'use client';

import type { ReactNode } from 'react';

interface CardsProps {
  children: ReactNode;
  cols?: string;
  footer?: ReactNode;
  className?: string;
}

export function Cards({ children, cols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', footer, className = '' }: CardsProps) {
  return (
    <div className={className}>
      <div className={`grid ${cols} gap-4`}>{children}</div>
      {footer !== undefined && <div className="col-span-full flex justify-center py-8">{footer}</div>}
    </div>
  );
}

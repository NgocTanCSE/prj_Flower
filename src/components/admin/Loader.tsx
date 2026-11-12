'use client';

/**
 * Loader – spinner tải dữ liệu (Server Component/Action).
 */

import React from 'react';

export type LoaderVariant = 'spinner' | 'dots' | 'pulse' | 'inline';

interface LoaderProps {
  variant?: LoaderVariant;
  name?: string;
}

export function Loader({ variant = 'spinner', name = 'Đang tải...' }: LoaderProps) {
  const size: Record<LoaderVariant, string> = {
    spinner: 'w-6 h-6 border-2 border-white border-t-transparent',
    dots: 'w-7 h-7',
    pulse: 'w-6 h-6 rounded-full',
    inline: 'w-4 h-4 border-2 border-white border-t-transparent',
  };
  const colors: Record<LoaderVariant, string> = {
    spinner: 'border-[#8b5f65] border-t-white',
    dots: 'text-[#8b5f65]',
    pulse: 'bg-[#8b5f65]',
    inline: 'border-[#8b5f65] border-t-white',
  };
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${name ? 'py-4' : ''}`}
    >
      {variant === 'dots' ? (
        <div className="flex items-center justify-center gap-1">
          <span className="block h-2 w-2 rounded-full bg-[#8b5f65] animate-bounce" />
          <span className="block h-2 w-2 rounded-full bg-[#8b5f65] animate-bounce" style={{ animationDelay: '0.1s' }} />
          <span className="block h-2 w-2 rounded-full bg-[#8b5f65] animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      ) : (
        <div className={`${size[variant]} rounded-full border ${colors[variant]} animate-spin`} />
      )}
      {name && <p className="text-sm text-[#5b5b5b]">{name}</p>}
    </div>
  );
}

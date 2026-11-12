'use client';

/**
 * Button – hệ thống nút Admin.
 * Kích thước mặc định, thiết bị, nổi bật, phản hồi, web endpoint (text).
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/60';
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg',
  };
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-[#8b5f65] text-white hover:bg-[#764f54] focus:ring-[#8b5f65]',
    secondary:
      'bg-white text-[#5b5b5b] border border-[#e8e1e1] hover:bg-[#f4eeef] hover:text-[#8b5f65] focus:ring-[#8b5f65]',
    ghost: 'bg-transparent text-[#5b5b5b] hover:bg-[#f4eeef] hover:text-[#8b5f65] focus:ring-[#8b5f65]',
    danger: 'bg-[#cc3d3d] text-white hover:bg-[#9e2a2a] focus:ring-[#cc3d3d]',
    success: 'bg-[#3f7f63] text-white hover:bg-[#325442] focus:ring-[#3f7f63]',
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

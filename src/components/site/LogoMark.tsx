interface LogoMarkProps {
  size?: number
  className?: string
}

/** Biểu tượng hoa stylised (5 cánh + nhụy), dùng cho logo khi DB chưa có ảnh. */
export function LogoMark({ size = 28, className = '' }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="4.6" fill="currentColor" opacity="0.95" />
      <ellipse cx="16" cy="6.4" rx="3.4" ry="5.6" fill="currentColor" opacity="0.5" />
      <ellipse cx="16" cy="25.6" rx="3.4" ry="5.6" fill="currentColor" opacity="0.5" />
      <ellipse cx="6.4" cy="16" rx="5.6" ry="3.4" fill="currentColor" opacity="0.5" />
      <ellipse cx="25.6" cy="16" rx="5.6" ry="3.4" fill="currentColor" opacity="0.5" />
      <circle cx="16" cy="16" r="1.4" fill="currentColor" opacity="0.85" />
    </svg>
  )
}

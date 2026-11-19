'use client';

/**
 * AdminTopBar – thanh trên cùng nhỏ CHỈ hiển thị trên mobile.
 *
 * Desktop: sidebar trái đã chiếm vai trò nav nên không cần thanh này.
 * Mobile: cung cấp nút mở/drawer (sidebar) + nhãn trang, đóng kín nội
 *   dung phía dưới bằng `h-14` ở `<main className="mt-14 lg:mt-0">`.
 * Nút hamburger biến hình X khi drawer đang mở.
 */

interface AdminTopBarProps {
  onMenu: () => void;
  /** Drawer đang mở hay không (để aria-expanded + icon X đúng). */
  open: boolean;
}

export function AdminTopBar({ onMenu, open }: AdminTopBarProps) {
  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-2 border-b border-[#e8e1e1] bg-white/95 px-4 backdrop-blur-sm lg:hidden"
    >
      <button
        type="button"
        onClick={onMenu}
        aria-label={open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e1e1] bg-white text-[#5b5b5b] transition-colors hover:bg-[#f4eeef] hover:text-[#8b5f65]"
      >
        {open ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      <span className="flex-1 truncate text-center text-sm font-bold text-[#8b5f65]">Quản trị</span>

      <span className="w-9" /> {/* giữ symmetry, tránh toast che lấp nút mở */}
    </div>
  );
}

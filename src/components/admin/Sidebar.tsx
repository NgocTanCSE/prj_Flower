'use client';

/**
 * Sidebar – thanh điều hướng quản trị neo bên trái màn hình.
 *
 * Desktop (≥ lg): neo cố định full-height, nằm trong flow bố cục.
 * Mobile: drawer trượt từ trái, mở bằng nút hamburger trên thanh top bar,
 *   đóng bằng nút × bên trong, click backdrop, chọn nav, hoặc phím Esc.
 *
 * Trợ năng mobile khi drawer mở:
 *   - Focus tự đưa vào drawer, Tab/Shift+Tab tuần hoàn trong drawer.
 *   - Esc đóng và focus trả về nút mở drawer.
 *   - Cuộn nền bị khoá; drawer ẩn khỏi cây truy cập (inert/aria-hidden).
 *
 * Chứa: thương hiệu, danh mục nav (chỉ báo active), tên người dùng +
 *   nút đăng xuất ở chân.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from './Button';
import { logout } from '@/app/(auth)/actions';

export interface AdminMenuItem {
  path: string;
  label: string;
}

const NAV: AdminMenuItem[] = [
  { label: 'Tổng quan', path: '/admin/dashboard' },
  { label: 'Danh giá', path: '/admin/danh-gia' },
  { label: 'Thư viện', path: '/admin/thu-vien' },
  { label: 'Sản phẩm', path: '/admin/san-pham' },
  { label: 'Danh mục', path: '/admin/danh-muc' },
  { label: 'Cài đặt', path: '/admin/cai-dat' },
  { label: 'Thống kê', path: '/admin/thong-ke' },
];

interface AdminSidebarProps {
  /** Tên hiển thị của người dùng (từ server layout). */
  userLabel?: string;
  /** Mobile: drawer đang mở. Desktop luôn "mở". */
  open?: boolean;
  /** Mobile: đóng drawer. */
  onClose?: () => void;
}

/** Các phần tử có thể focus được. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function AdminSidebar({ userLabel, open = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Chỉ áp dụng hành vi drawer (focus/trap/Esc) trên màn hình di động.
  // `isDesktop` khởi tạo `false` để khớp SSR (tránh hydration mismatch — lỗi
  // này khiến trang PROD hoàn toàn đơ); effect matchMedia bên dưới khởi tạo
  // đúng giá trị sau mount. `mounted` loại bỏ luôn màn inert nháy ở lần đầu.
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mql.matches);
    setIsDesktop(mql.matches); // khởi tạo NGAY SAU mount
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // ---- Drawer mở (mobile): lưu focus opener, focus vào drawer, Esc + trap Tab ----
  useEffect(() => {
    if (isDesktop || !open || !onClose) return;
    const drawer = asideRef.current;
    if (!drawer) return;

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Đưa focus vào drawer ngay khi mở (ưu nút đóng).
    const closeBtn = drawer.querySelector<HTMLElement>('button[aria-label="Đóng menu"]');
    (closeBtn ?? drawer).focus();

    // Khoá cuộn nền.
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isDesktop, open, onClose]);

  // ---- Drawer đóng (mobile): trả focus về nút mở drawer. ----
  useEffect(() => {
    if (isDesktop) return;
    if (!open) {
      openerRef.current?.focus();
      openerRef.current = null;
    }
  }, [isDesktop, open]);

  // Mobile đóng: ẩn khỏi cây truy cập; Desktop luôn hiển thị.
  // (chỉ áp inert sau khi đã mount — tránh nháy inert lần đầu trên desktop)
  const hiddenOnMobile = mounted && !isDesktop && !open;

  return (
    <>
      {/* Backdrop đóng drawer (chỉ có tác dụng trên mobile). */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/40 lg:hidden
          ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}
          transition-opacity duration-200
        `}
        onClick={() => onClose?.()}
        aria-hidden="true"
      />

      <aside
        ref={asideRef}
        className={`
          fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-[#faf5fa] border-r border-[#e8e1e1]
          shadow-[0_8px_24px_rgba(92,58,64,0.08)]
          transition-transform duration-250
          pt-14 lg:pt-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        aria-hidden={hiddenOnMobile || undefined}
        inert={hiddenOnMobile || undefined}
      >
        {/* ---- Thương hiệu ---- */}
        <div className="relative p-6 pb-4">
          <Link href="/admin/dashboard" className="block" onClick={() => onClose?.()}>
            <h2 className="text-2xl font-bold text-[#8b5f65] tracking-tight">Quản trị</h2>
            <p className="mt-1 text-xs text-[#5b5b5b]">Tiệm Hoa Shop Flower</p>
          </Link>
          {/* Nút đóng drawer (chỉ mobile). */}
          <button
            type="button"
            onClick={() => onClose?.()}
            className="absolute right-4 top-4 rounded-lg p-1 text-[#999] transition-colors hover:bg-[#f4eeef] hover:text-[#5b5b5b]"
            aria-label="Đóng menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Nav ---- */}
        <nav className="flex-1 overflow-y-auto px-4">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname === item.path
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => onClose?.()}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200
                      ${active
                        ? 'bg-[#8b5f65] text-white'
                        : 'text-[#5b5b5b] hover:bg-[#f4eeef] hover:text-[#8b5f65]'}
                    `}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ---- Chân: người dùng + đăng xuất ---- */}
        <div className="border-t border-[#e8e1e1] p-4">
          {userLabel ? (
            <p className="mb-3 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[#999]">{userLabel}</p>
          ) : null}
          <form action={logout} method="POST">
            <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:bg-red-50">
              Đăng xuất
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}

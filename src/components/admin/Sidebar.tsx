'use client';

/**
 * Sidebar – thanh điều hướng quản trị (kẹp Cru fit bên trái màn hình).
 * Các mục menu được truyền từ `AdminLayout` (A2).
 */

import React from 'react';
import Link from 'next/link';
import { Button } from './Button';

export interface AdminMenuItem {
  path: string;
  label: string;
}

export interface AdminSidebarProps {
  items: AdminMenuItem[];
  active?: string;
  className?: string;
}

export function AdminSidebar({ items, active }: AdminSidebarProps) {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-[#faf5fa] border-r border-[#e8e1e1]">
      <div className="p-6 pb-4">
        <Link href="/admin/dashboard" className="block">
          <h2 className="text-2xl font-bold text-[#8b5f65] tracking-tight">Quản trị</h2>
          <p className="text-xs text-[#5b5b5b]">Tiệm Hoa CoBeCuBe</p>
        </Link>
      </div>
      <nav className="flex-1 px-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const activePath = active === item.path || (item.path !== '/admin' && active === `${item.path}/`);
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors
                    ${activePath
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
      <div className="p-4 border-t border-[#e8e1e1]">
        <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:bg-red-50">
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}

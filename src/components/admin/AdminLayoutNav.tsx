'use client';

/**
 * AdminLayoutNav – wrapper client của thanh điều hướng trái.
 *
 * Giữ state `mobileOpen` (drawer mobile) và render:
 *   - `AdminTopBar` (chỉ mobile): nút mở drawer.
 *   - `AdminSidebar`: sidebar trái (desktop: luôn hiện; mobile: drawer).
 *
 * Server layout truyền `userLabel` xuống để sidebar hiển thị tên admin.
 */

import { useState } from 'react';

import { AdminSidebar } from './Sidebar';
import { AdminTopBar } from './AdminTopBar';

interface AdminLayoutNavProps {
  userLabel?: string;
}

export function AdminLayoutNav({ userLabel }: AdminLayoutNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <AdminTopBar onMenu={() => setMobileOpen(true)} open={mobileOpen} />
      <AdminSidebar userLabel={userLabel} open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

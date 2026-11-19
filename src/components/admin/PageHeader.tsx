/**
 * PageHeader – tiêu đề trang quản trị chuẩn hóa.
 *
 * Mọi trang admin (dashboard, sản phẩm, danh mục, đánh giá, cài đặt,
 * thư viện, thống kê) dùng component này để tiêu đề/subtitle có cùng
 * kích thước, khoảng cách và hiệu ứng hiện lên — thay vì mỗi chỗ một
 * kiểu `text-2xl font-bold` khác nhau.
 */

import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Nút/chức năng chính của trang (thêm, làm mới...) bên phải tiêu đề. */
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="admin-page-header mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="admin-page-title">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#5b5b5b]">{subtitle}</p> : null}
      </div>
      {action ? <div className="admin-page-header-action">{action}</div> : null}
    </div>
  )
}

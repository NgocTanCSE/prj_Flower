import type { ReactNode } from 'react'

/**
 * StableLabel – giữ nguyên bề rộng nút khi nhãn thay đổi.
 *
 * Nhãn dài nhất (`reserve`) được render ẩn để chiếm chỗ; nhãn thật nằm chồng
 * lên cùng một ô lưới. Nhờ vậy `Công bố → Hủy`, `Ẩn → Hiện lại`,
 * `Lưu cài đặt → Đang lưu...`... không làm nút co giãn và không đẩy các nút
 * bên cạnh nhảy.
 */
export interface StableLabelProps {
  /** Nhãn đang hiển thị. */
  children: ReactNode
  /** Nhãn dài nhất trong mọi trạng thái — dùng để giữ chỗ. */
  reserve: string
}

export function StableLabel({ children, reserve }: StableLabelProps) {
  return (
    <span className="inline-grid justify-items-center">
      <span
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 whitespace-nowrap"
      >
        {reserve}
      </span>
      <span className="col-start-1 row-start-1 whitespace-nowrap">{children}</span>
    </span>
  )
}
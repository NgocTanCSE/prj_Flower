'use client'

/**
 * ColorField – chọn màu cho theme, thân thiện cả với người không biết code.
 *
 * Gồm 3 cách chọn, tất cả đồng bộ với nhau:
 *   1. Bảng màu gợi ý (bấm 1 ô là xong)
 *   2. Color picker của trình duyệt (`<input type="color">`)
 *   3. Ô nhập mã hex cho người rành kỹ thuật
 *
 * Giá trị gửi lên server nằm ở ô text `name={name}` nên vẫn tương thích
 * hoàn toàn với `updateSettings(formData)`.
 */

import { useState } from 'react'

/** Màu chủ đạo gợi ý — tông hoa, pastel, tự nhiên. */
const PRIMARY_PRESETS = [
  '#8b5f65', // hồng tro (mặc định)
  '#b76e79', // hồng đất
  '#d9a7b0', // hồng phấn
  '#c97b84', // hồng san hô
  '#6b8f71', // xanh sage
  '#2f4858', // xanh navy
  '#7c6a9c', // tím lavender
  '#a0522d', // nâu terracotta
  '#c9a227', // vàng gold
  '#1a1a1a', // đen than
]

/** Màu chữ gợi ý — luôn đủ tương phản trên nền sáng. */
const INK_PRESETS = [
  '#1a1a1a', // đen (mặc định)
  '#2b2b2b',
  '#3d3d3d',
  '#4a4a4a',
  '#5b5b5b',
  '#6b4f52', // nâu hồng
  '#2f4858', // navy
  '#3f7f63', // xanh rêu
]

/** Chấp nhận `#abc`, `#aabbcc`, `abc`, `aabbcc` → chuẩn hoá `#aabbcc`. */
export function normalizeHex(input: string): string | null {
  const match = input.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!match) return null
  let hex = match[1].toLowerCase()
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  return `#${hex}`
}

/** Màu chữ đọc được trên nền `hex` (dùng cho ô xem trước). */
function contrastInk(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#1a1a1a' : '#ffffff'
}

export interface ColorFieldProps {
  /** Tên field trong `FormData` (vd: `site_theme_primary`). */
  name: string
  label: string
  /** Giá trị hiện tại (đã fallback về mặc định ở nơi gọi). */
  defaultValue: string
  variant: 'primary' | 'ink'
  hint?: string
}

const FIELD_CLASS =
  'w-full rounded-lg border border-[#e8e1e1] px-3 py-2 font-mono text-sm uppercase tracking-wide outline-none transition-colors focus:ring-2 focus:ring-[#8b5f65]/40'

export function ColorField({ name, label, defaultValue, variant, hint }: ColorFieldProps) {
  const fallback = normalizeHex(defaultValue) ?? (variant === 'primary' ? '#8b5f65' : '#1a1a1a')
  const [value, setValue] = useState(fallback)

  const normalized = normalizeHex(value)
  const invalid = value.trim() !== '' && normalized === null
  // Picker chỉ nhận #rrggbb; giá trị đang gõ dở thì hiển thị màu hợp lệ gần nhất.
  const pickerValue = normalized ?? fallback
  const swatches = variant === 'primary' ? PRIMARY_PRESETS : INK_PRESETS

  return (
    <div className="flex flex-col gap-2 md:col-span-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#5b5b5b]">{label}</span>
        <code className="rounded bg-[#f4eeef] px-1.5 py-0.5 text-[11px] font-semibold uppercase text-[#8b5f65]">
          {normalized ?? 'chưa hợp lệ'}
        </code>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => setValue(event.target.value)}
          aria-label={`Bảng màu cho ${label}`}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-[#e8e1e1] bg-white p-1"
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => {
            // Gõ xong thì chuẩn hoá về #rrggbb để DB luôn sạch.
            if (normalized) setValue(normalized)
          }}
          placeholder={fallback}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          aria-label={`Mã màu hex cho ${label}`}
          aria-invalid={invalid || undefined}
          className={FIELD_CLASS}
        />
        <button
          type="button"
          onClick={() => setValue(fallback)}
          className="shrink-0 rounded-lg border border-[#e8e1e1] bg-white px-3 py-2 text-xs font-medium text-[#5b5b5b] transition-colors hover:bg-[#f4eeef]"
          title={`Đặt lại màu mặc định ${fallback}`}
        >
          Mặc định
        </button>
      </div>

      {/* Bảng màu gợi ý */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Màu gợi ý cho ${label}`}>
        {swatches.map((hex) => {
          const selected = normalized === hex
          return (
            <button
              key={hex}
              type="button"
              onClick={() => setValue(hex)}
              aria-label={`Chọn màu ${hex}`}
              aria-pressed={selected}
              title={hex}
              className={`h-7 w-7 rounded-full border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5f65] focus-visible:ring-offset-1 ${
                selected ? 'border-white ring-2 ring-[#8b5f65] ring-offset-1' : 'border-black/10'
              }`}
              style={{ backgroundColor: hex }}
            />
          )
        })}
      </div>

      {/* Xem trước nhanh */}
      <div className="flex items-center gap-2 rounded-lg border border-[#e8e1e1] bg-white px-2.5 py-1.5">
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: pickerValue }}
          aria-hidden="true"
        />
        <span className="text-sm font-semibold" style={{ color: pickerValue }}>
          Hoa tươi mỗi ngày
        </span>
        <span
          className="ml-auto rounded px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: pickerValue, color: contrastInk(pickerValue) }}
        >
          Aa
        </span>
      </div>

      {invalid ? (
        <p role="alert" className="text-xs text-red-600">
          Mã màu phải dạng #rgb hoặc #rrggbb, ví dụ #8b5f65.
        </p>
      ) : hint ? (
        <p className="text-xs text-[#999]">{hint}</p>
      ) : null}
    </div>
  )
}
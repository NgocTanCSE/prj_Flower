'use client'

/**
 * CsvTransfer – khối "Nhập / xuất CSV" dùng chung cho trang Sản phẩm & Danh mục.
 *
 * Luồng nhập:
 *   1. Chọn file → parse + validate ngay trên trình duyệt.
 *   2. Hiện preview từng dòng (hợp lệ / lỗi + lý do) — chưa ghi DB.
 *   3. Bấm xác nhận → server action kiểm tra lại rồi upsert theo `slug`.
 *
 * Nhờ vậy người dùng thấy lỗi trước khi dữ liệu bị ghi, và nhập lại file cũ
 * không tạo bản trùng.
 */

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { importCategoriesCsv, importProductsCsv } from '@/app/admin/api/actions/csv-import'
import { Button } from '@/components/admin/Button'
import { StableLabel } from '@/components/admin/StableLabel'
import { notifyToast } from '@/components/admin/toast/toast'
import { MAX_CSV_BYTES, parseCsv, toCsv, type CsvCell, type CsvTable } from '@/lib/csv'
import {
  CATEGORY_CSV_HEADERS,
  MAX_CSV_ROWS,
  PRODUCT_CSV_HEADERS,
  validateCategoryRows,
  validateProductRows,
} from '@/lib/csv-import'

type Entity = 'products' | 'categories'

interface PreviewRow {
  line: number
  label: string
  errors: string[]
}

interface Preview {
  fileName: string
  table: CsvTable
  fileErrors: string[]
  rows: PreviewRow[]
  valid: number
  invalid: number
}

interface CsvTransferProps {
  entity: Entity
  /** Slug danh mục hiện có — báo lỗi `category_slug` ngay trên preview. */
  existingCategorySlugs?: string[]
}

const ENTITY_LABEL: Record<Entity, string> = {
  products: 'sản phẩm',
  categories: 'danh mục',
}

const EXPORT_HREF: Record<Entity, string> = {
  products: '/admin/api/export/products',
  categories: '/admin/api/export/categories',
}

const REQUIRED_HINT: Record<Entity, string> = {
  products: 'Cột bắt buộc: slug, name, price, category_slug.',
  categories: 'Cột bắt buộc: slug, name.',
}

/** Tải nội dung CSV thành file (kèm BOM để Excel đọc đúng tiếng Việt). */
function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function CsvTransfer({ entity, existingCategorySlugs = [] }: CsvTransferProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [preview, setPreview] = useState<Preview | null>(null)

  const headers = entity === 'products' ? PRODUCT_CSV_HEADERS : CATEGORY_CSV_HEADERS
  const knownSlugs = new Set(existingCategorySlugs.map((slug) => slug.toLowerCase()))

  function downloadTemplate() {
    const sample: CsvCell[][] =
      entity === 'products'
        ? [
            [
              'vi-du-bo-hoa',
              'Bó hoa ví dụ',
              'Mô tả ngắn',
              'Mô tả chi tiết',
              350000,
              450000,
              existingCategorySlugs[0] ?? 'hoa-sinh-nhat',
              0.5,
              0,
              999,
              'draft',
              1,
              '',
            ],
          ]
        : [['hoa-sinh-nhat', 'Hoa sinh nhật', '', 999, 1]]

    downloadCsv(
      entity === 'products' ? 'mau-san-pham.csv' : 'mau-danh-muc.csv',
      toCsv(headers, sample)
    )
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    if (file.size > MAX_CSV_BYTES) {
      notifyToast(`File quá lớn (tối đa ${Math.round(MAX_CSV_BYTES / 1024 / 1024)} MB).`, 'error')
      input.value = ''
      return
    }

    try {
      const text = await file.text()
      if (text.includes('\uFFFD')) {
        notifyToast(
          'File có thể không phải UTF-8 — dấu tiếng Việt sẽ sai. Hãy lưu lại dạng "CSV UTF-8".',
          'info'
        )
      }

      const table = parseCsv(text)
      if (table.rows.length > MAX_CSV_ROWS) {
        throw new Error(`Tối đa ${MAX_CSV_ROWS} dòng mỗi lần nhập (file có ${table.rows.length}).`)
      }

      const validation =
        entity === 'products'
          ? validateProductRows(table, knownSlugs)
          : validateCategoryRows(table, knownSlugs)

      setPreview({
        fileName: file.name,
        table,
        fileErrors: validation.fileErrors,
        rows: validation.rows.map((row) => ({
          line: row.line,
          label: row.label,
          errors: row.errors,
        })),
        valid: validation.valid,
        invalid: validation.invalid,
      })
    } catch (error) {
      setPreview(null)
      notifyToast(error instanceof Error ? error.message : 'Không đọc được file CSV.', 'error')
    } finally {
      input.value = ''
    }
  }

  function handleImport() {
    if (!preview) return
    const table = preview.table

    startTransition(async () => {
      try {
        const result =
          entity === 'products'
            ? await importProductsCsv(table)
            : await importCategoriesCsv(table)

        if (!result.ok) {
          notifyToast(result.error ?? 'Nhập CSV thất bại.', 'error')
          return
        }

        notifyToast(
          `Đã nhập ${ENTITY_LABEL[entity]}: ${result.created} mới, ${result.updated} cập nhật, ${result.skipped} bỏ qua.`,
          result.skipped > 0 ? 'info' : 'success'
        )
        if (result.warning) notifyToast(result.warning, 'error')

        setPreview(null)
        router.refresh()
      } catch (error) {
        notifyToast(error instanceof Error ? error.message : 'Nhập CSV thất bại.', 'error')
      }
    })
  }

  return (
    <div className="mb-5">
      {/* ---------- Thanh công cụ ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8e1e1] bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[#1a1a1a]">Nhập / xuất CSV</p>
          <p className="text-xs text-[#999]">
            Mở trực tiếp bằng Excel (lưu dạng CSV UTF-8). Tối đa {MAX_CSV_ROWS} dòng mỗi lần
            nhập.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate}>
            Tải file mẫu
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <StableLabel reserve="Đóng nhập CSV">
              {open ? 'Đóng nhập CSV' : 'Nhập CSV'}
            </StableLabel>
          </Button>
          <a
            href={EXPORT_HREF[entity]}
            className="inline-flex items-center justify-center rounded-lg border border-[#e8e1e1] bg-white px-3 py-1.5 text-sm font-medium text-[#5b5b5b] transition-colors hover:bg-[#f4eeef] hover:text-[#8b5f65]"
          >
            Xuất CSV
          </a>
        </div>
      </div>

      {/* ---------- Khung nhập ---------- */}
      {open ? (
        <div className="mt-3 rounded-xl border border-[#e8e1e1] bg-white p-4 sm:p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#5b5b5b]">Chọn file CSV</span>
            <input
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              onChange={handleFile}
              disabled={pending}
              className="w-full rounded-lg border border-[#e8e1e1] bg-white px-3 py-2 text-sm outline-none transition-colors
                file:mr-4 file:rounded-lg file:border file:border-[#e8e1e1] file:bg-[#f4eeef]
                file:px-3 file:py-1 file:text-sm file:font-medium file:text-[#8b5f65]
                focus:ring-2 focus:ring-[#8b5f65]/40"
            />
          </label>
          <p className="mt-2 text-xs text-[#999]">
            {REQUIRED_HINT[entity]} Cột khác có thể bỏ trống. Nhập trùng <code>slug</code> sẽ
            cập nhật dòng cũ — cột trống được ghi theo giá trị mặc định, không giữ dữ liệu cũ.
          </p>

          {preview ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-[#1a1a1a]">{preview.fileName}</span>
                <span className="rounded-full bg-[#f4eeef] px-2 py-0.5 text-xs font-medium text-[#8b5f65]">
                  {preview.valid} hợp lệ
                </span>
                {preview.invalid > 0 ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    {preview.invalid} lỗi
                  </span>
                ) : null}
              </div>

              {preview.fileErrors.length > 0 ? (
                <ul
                  role="alert"
                  className="list-disc space-y-1 rounded-lg bg-red-50 px-5 py-3 text-sm text-red-700"
                >
                  {preview.fileErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              ) : null}

              {preview.rows.length > 0 ? (
                <div className="max-h-72 overflow-auto rounded-lg border border-[#e8e1e1]">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-[#faf5fa] text-xs uppercase tracking-wide text-[#5b5b5b]">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">Dòng</th>
                        <th scope="col" className="px-3 py-2 font-medium">Tên</th>
                        <th scope="col" className="px-3 py-2 font-medium">Trạng thái</th>
                        <th scope="col" className="px-3 py-2 font-medium">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4eeef]">
                      {preview.rows.slice(0, 50).map((row) => (
                        <tr key={row.line} className={row.errors.length > 0 ? 'bg-red-50/60' : ''}>
                          <td className="px-3 py-2 tabular-nums text-[#999]">{row.line}</td>
                          <td className="px-3 py-2 font-medium text-[#1a1a1a]">{row.label}</td>
                          <td className="px-3 py-2">
                            {row.errors.length > 0 ? (
                              <span className="text-red-600">Lỗi</span>
                            ) : (
                              <span className="text-[#3f7f63]">Hợp lệ</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[#5b5b5b]">{row.errors.join(' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {preview.rows.length > 50 ? (
                <p className="text-xs text-[#999]">
                  Chỉ hiển thị 50 / {preview.rows.length} dòng trong bảng xem trước.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={pending || preview.valid === 0}
                >
                  <StableLabel reserve={`Nhập ${MAX_CSV_ROWS} dòng hợp lệ`}>
                    {pending ? 'Đang nhập...' : `Nhập ${preview.valid} dòng hợp lệ`}
                  </StableLabel>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPreview(null)}
                  disabled={pending}
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
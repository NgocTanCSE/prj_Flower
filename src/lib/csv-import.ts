/**
 * Chuẩn hoá & kiểm tra dữ liệu CSV trước khi ghi DB.
 *
 * Module THUẦN (không import Supabase/Next) để dùng chung:
 *   - Client: hiện preview, báo lỗi từng dòng trước khi gửi.
 *   - Server: kiểm tra lại toàn bộ (không tin client) rồi mới upsert.
 *
 * Nguyên tắc: mọi lỗi đều gắn với SỐ DÒNG thật trong file để người dùng sửa
 * đúng chỗ trong Excel.
 */

import type { CsvTable } from './csv'
import { slugify } from './slug'

/** Số dòng tối đa mỗi lần nhập (tránh payload quá lớn). */
export const MAX_CSV_ROWS = 500

/** Độ dài tối đa một ô (chống payload rác). */
export const MAX_CSV_CELL_LENGTH = 20_000

/** Cột file CSV xuất/nhập sản phẩm (đúng thứ tự này). */
export const PRODUCT_CSV_HEADERS = [
  'slug',
  'name',
  'short_desc',
  'description',
  'price',
  'old_price',
  'category_slug',
  'weight',
  'featured_is',
  'sort_order',
  'status',
  'is_active',
  'image_url',
] as const

/** Cột file CSV xuất/nhập danh mục. */
export const CATEGORY_CSV_HEADERS = ['slug', 'name', 'parent_slug', 'sort_order', 'active'] as const

export interface ImportRow<T> {
  /** Số dòng trong file (1-based, đã tính dòng tiêu đề). */
  line: number
  /** Nhãn hiển thị trong bảng preview. */
  label: string
  errors: string[]
  /** Chỉ có khi `errors` rỗng. */
  data?: T
}

export interface ImportValidation<T> {
  rows: ImportRow<T>[]
  /** Lỗi cấp file (thiếu cột, quá nhiều dòng...). */
  fileErrors: string[]
  valid: number
  invalid: number
}

export interface ProductImportData {
  slug: string
  name: string
  short_desc: string
  description: string
  price: number
  old_price: number | null
  category_slug: string
  weight: number
  featured_is: boolean
  sort_order: number
  status: 'draft' | 'published'
  is_active: boolean
  image_url: string
}

export interface CategoryImportData {
  slug: string
  name: string
  parent_slug: string
  sort_order: number
  active: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'y', 'on', 'có', 'co', 'bật', 'bat'])
const FALSE_VALUES = new Set(['0', 'false', 'no', 'n', 'off', 'không', 'khong', 'tắt', 'tat'])

function normalizeHeaders(headers: string[]): string[] {
  return headers.map((header) => header.trim().toLowerCase())
}

function toRecord(headers: string[], cells: string[]): Record<string, string> {
  const record: Record<string, string> = {}
  for (let i = 0; i < headers.length; i++) {
    record[headers[i]] = unarmor((cells[i] ?? '').trim())
  }
  return record
}

/** Gỡ dấu `'` do bước xuất CSV thêm vào để chống formula injection. */
function unarmor(value: string): string {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value
}

/** Nhận cả `150000`, `150.000`, `150,000`; trả `null` nếu không phải số. */
function toNumber(raw: string): number | null {
  const text = raw.trim().replace(/\s/g, '')
  if (text === '') return null
  // Dấu `.`/`,` nhóm hàng nghìn (150.000 hoặc 150,000).
  const normalized = /^-?\d{1,3}([.,]\d{3})+$/.test(text)
    ? text.replace(/[.,]/g, '')
    : text.replace(/,/g, '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function toInteger(raw: string): number | null {
  const value = toNumber(raw)
  return value !== null && Number.isInteger(value) ? value : null
}

function toBoolean(raw: string): boolean | null {
  const text = raw.trim().toLowerCase()
  if (TRUE_VALUES.has(text)) return true
  if (FALSE_VALUES.has(text)) return false
  return null
}

function checkCellLengths(table: CsvTable): string[] {
  for (const row of table.rows) {
    if (row.cells.some((cell) => cell.length > MAX_CSV_CELL_LENGTH)) {
      return [`Dòng ${row.line}: có ô quá dài (tối đa ${MAX_CSV_CELL_LENGTH} ký tự).`]
    }
  }
  return []
}

function summarize<T>(rows: ImportRow<T>[], fileErrors: string[]): ImportValidation<T> {
  const valid = rows.filter((row) => row.errors.length === 0).length
  return { rows, fileErrors, valid, invalid: rows.length - valid }
}

// ---------------------------------------------------------------------------
// Sản phẩm
// ---------------------------------------------------------------------------

export function validateProductRows(
  table: CsvTable,
  categorySlugs: ReadonlySet<string>
): ImportValidation<ProductImportData> {
  const headers = normalizeHeaders(table.headers)
  const fileErrors: string[] = []
  const missing = ['slug', 'name', 'price', 'category_slug'].filter((key) => !headers.includes(key))
  if (missing.length > 0) {
    return { rows: [], fileErrors: [`Thiếu cột bắt buộc: ${missing.join(', ')}.`], valid: 0, invalid: 0 }
  }
  if (table.rows.length === 0) fileErrors.push('File không có dòng dữ liệu.')
  if (table.rows.length > MAX_CSV_ROWS) {
    fileErrors.push(`Tối đa ${MAX_CSV_ROWS} dòng mỗi lần nhập (file có ${table.rows.length}).`)
  }
  fileErrors.push(...checkCellLengths(table))

  const knownCategories = new Set([...categorySlugs].map((slug) => slug.toLowerCase()))
  const seenSlugs = new Map<string, number>()

  const rows = table.rows.map(({ line, cells }): ImportRow<ProductImportData> => {
    const record = toRecord(headers, cells)
    const errors: string[] = []

    const name = record.name ?? ''
    const slug = (record.slug || (name ? slugify(name) : '')).toLowerCase()

    if (!name) errors.push('Thiếu tên sản phẩm.')
    else if (name.length > 200) errors.push('Tên sản phẩm tối đa 200 ký tự.')

    if (!slug) {
      errors.push('Thiếu slug (không tạo được từ tên).')
    } else {
      if (slug.length > 200) errors.push('Slug tối đa 200 ký tự.')
      if (/\s/.test(slug)) errors.push('Slug không được chứa khoảng trắng.')
      const previousLine = seenSlugs.get(slug)
      if (previousLine) errors.push(`Slug trùng với dòng ${previousLine}.`)
      else seenSlugs.set(slug, line)
    }

    const categorySlug = (record.category_slug ?? '').toLowerCase()
    if (!categorySlug) errors.push('Thiếu category_slug.')
    else if (!knownCategories.has(categorySlug)) errors.push(`Danh mục "${categorySlug}" không tồn tại.`)

    const price = toInteger(record.price ?? '')
    if (price === null) errors.push('Giá phải là số nguyên không âm.')
    else if (price < 0) errors.push('Giá không thể âm.')

    const oldPriceRaw = (record.old_price ?? '').trim()
    const oldPrice = oldPriceRaw === '' ? null : toInteger(oldPriceRaw)
    if (oldPriceRaw !== '' && (oldPrice === null || oldPrice < 0)) {
      errors.push('Giá cũ phải là số nguyên không âm.')
    }

    const weightRaw = (record.weight ?? '').trim()
    const weight = weightRaw === '' ? 0 : toNumber(weightRaw)
    if (weight === null || weight < 0) errors.push('Cân nặng phải là số không âm.')

    const featured =
      (record.featured_is ?? '').trim() === '' ? false : toBoolean(record.featured_is ?? '')
    if (featured === null) errors.push('featured_is chỉ nhận 1/0 (true/false).')

    const sortRaw = (record.sort_order ?? '').trim()
    const sortOrder = sortRaw === '' ? 999 : toInteger(sortRaw)
    if (sortOrder === null || sortOrder < 0) errors.push('Thứ tự phải là số nguyên không âm.')

    const statusRaw = ((record.status ?? '').trim().toLowerCase() || 'draft') as string
    if (statusRaw !== 'draft' && statusRaw !== 'published') {
      errors.push('status chỉ nhận draft hoặc published.')
    }

    const active = (record.is_active ?? '').trim() === '' ? true : toBoolean(record.is_active ?? '')
    if (active === null) errors.push('is_active chỉ nhận 1/0 (true/false).')

    const imageUrl = (record.image_url ?? '').trim()
    if (imageUrl) {
      if (imageUrl.length > 2000) errors.push('URL ảnh tối đa 2000 ký tự.')
      else if (!/^(https?:\/\/|\/)/.test(imageUrl)) {
        errors.push('URL ảnh phải bắt đầu bằng http(s):// hoặc /.')
      }
    }

    const shortDesc = record.short_desc ?? ''
    const description = record.description ?? ''
    if (shortDesc.length > 2000) errors.push('Mô tả ngắn tối đa 2000 ký tự.')
    if (description.length > MAX_CSV_CELL_LENGTH) errors.push('Mô tả chi tiết quá dài.')

    const data: ProductImportData | undefined =
      errors.length === 0
        ? {
            slug,
            name,
            short_desc: shortDesc,
            description,
            price: price as number,
            old_price: oldPrice,
            category_slug: categorySlug,
            weight: weight as number,
            featured_is: featured as boolean,
            sort_order: sortOrder as number,
            status: statusRaw as 'draft' | 'published',
            is_active: active as boolean,
            image_url: imageUrl,
          }
        : undefined

    return { line, label: name || slug || `Dòng ${line}`, errors, data }
  })

  return summarize(rows, fileErrors)
}

// ---------------------------------------------------------------------------
// Danh mục
// ---------------------------------------------------------------------------

export function validateCategoryRows(
  table: CsvTable,
  existingSlugs: ReadonlySet<string>
): ImportValidation<CategoryImportData> {
  const headers = normalizeHeaders(table.headers)
  const fileErrors: string[] = []
  const missing = ['slug', 'name'].filter((key) => !headers.includes(key))
  if (missing.length > 0) {
    return { rows: [], fileErrors: [`Thiếu cột bắt buộc: ${missing.join(', ')}.`], valid: 0, invalid: 0 }
  }
  if (table.rows.length === 0) fileErrors.push('File không có dòng dữ liệu.')
  if (table.rows.length > MAX_CSV_ROWS) {
    fileErrors.push(`Tối đa ${MAX_CSV_ROWS} dòng mỗi lần nhập (file có ${table.rows.length}).`)
  }
  fileErrors.push(...checkCellLengths(table))

  const records = table.rows.map(({ line, cells }) => {
    const record = toRecord(headers, cells)
    const name = record.name ?? ''
    const slug = (record.slug || (name ? slugify(name) : '')).toLowerCase()
    return { line, record, name, slug }
  })

  // Danh mục cha có thể nằm trong chính file hoặc đã có trong DB.
  const knownSlugs = new Set([...existingSlugs].map((slug) => slug.toLowerCase()))
  for (const item of records) if (item.slug) knownSlugs.add(item.slug)

  const seenSlugs = new Map<string, number>()

  const rows = records.map(({ line, record, name, slug }): ImportRow<CategoryImportData> => {
    const errors: string[] = []

    if (!name) errors.push('Thiếu tên danh mục.')
    else if (name.length > 200) errors.push('Tên danh mục tối đa 200 ký tự.')

    if (!slug) {
      errors.push('Thiếu slug (không tạo được từ tên).')
    } else {
      if (slug.length > 200) errors.push('Slug tối đa 200 ký tự.')
      if (/\s/.test(slug)) errors.push('Slug không được chứa khoảng trắng.')
      const previousLine = seenSlugs.get(slug)
      if (previousLine) errors.push(`Slug trùng với dòng ${previousLine}.`)
      else seenSlugs.set(slug, line)
    }

    const parentSlug = (record.parent_slug ?? '').toLowerCase()
    if (parentSlug) {
      if (parentSlug === slug) errors.push('Danh mục không thể là cha của chính nó.')
      else if (!knownSlugs.has(parentSlug)) errors.push(`Danh mục cha "${parentSlug}" không tồn tại.`)
    }

    const sortRaw = (record.sort_order ?? '').trim()
    const sortOrder = sortRaw === '' ? 999 : toInteger(sortRaw)
    if (sortOrder === null || sortOrder < 0) errors.push('Thứ tự phải là số nguyên không âm.')

    const active = (record.active ?? '').trim() === '' ? true : toBoolean(record.active ?? '')
    if (active === null) errors.push('active chỉ nhận 1/0 (true/false).')

    const data: CategoryImportData | undefined =
      errors.length === 0
        ? {
            slug,
            name,
            parent_slug: parentSlug,
            sort_order: sortOrder as number,
            active: active as boolean,
          }
        : undefined

    return { line, label: name || slug || `Dòng ${line}`, errors, data }
  })

  return summarize(rows, fileErrors)
}
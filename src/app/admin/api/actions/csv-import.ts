'use server'

/**
 * Nhập dữ liệu từ CSV (sản phẩm, danh mục).
 *
 * Client đã parse file và hiện preview, nhưng server **kiểm tra lại từ đầu**
 * (không tin dữ liệu client gửi). Upsert theo `slug` nên nhập lại file cũ
 * không tạo bản trùng.
 */

import { revalidatePath } from 'next/cache'
import { createAdminClient } from './auth'
import { logAudit } from '@/lib/upload'
import { newBigIntId } from '@/lib/ids'
import type { CsvRow, CsvTable } from '@/lib/csv'
import {
  MAX_CSV_ROWS,
  validateCategoryRows,
  validateProductRows,
  type CategoryImportData,
  type ImportRow,
  type ImportValidation,
  type ProductImportData,
} from '@/lib/csv-import'

export interface CsvImportResult {
  ok: boolean
  error?: string
  /** Cảnh báo không chặn (vd: sản phẩm đã lưu nhưng ảnh lỗi). */
  warning?: string
  created: number
  updated: number
  skipped: number
  errors: Array<{ line: number; label: string; message: string }>
}

interface ValidRow<T> extends ImportRow<T> {
  data: T
}

function failure(
  message: string,
  skipped = 0,
  errors: CsvImportResult['errors'] = []
): CsvImportResult {
  return { ok: false, error: message, created: 0, updated: 0, skipped, errors }
}

function isCsvTable(value: unknown): value is CsvTable {
  if (!value || typeof value !== 'object') return false
  const table = value as Partial<CsvTable>
  if (!Array.isArray(table.headers) || !Array.isArray(table.rows)) return false
  if (!table.headers.every((header) => typeof header === 'string')) return false
  return table.rows.every((row) => {
    if (!row || typeof row !== 'object') return false
    const candidate = row as Partial<CsvRow>
    return (
      typeof candidate.line === 'number' &&
      Number.isFinite(candidate.line) &&
      Array.isArray(candidate.cells) &&
      candidate.cells.every((cell) => typeof cell === 'string')
    )
  })
}

function validRows<T>(rows: ImportRow<T>[]): ValidRow<T>[] {
  return rows.filter((row): row is ValidRow<T> => row.data !== undefined)
}

function collectErrors<T>(validation: ImportValidation<T>): CsvImportResult['errors'] {
  return validation.rows
    .filter((row) => row.errors.length > 0)
    .map((row) => ({ line: row.line, label: row.label, message: row.errors.join(' ') }))
}

function revalidateCatalog(): void {
  for (const path of ['/admin/san-pham', '/admin/danh-muc', '/', '/bo-suu-tap', '/search']) {
    revalidatePath(path)
  }
}

// ---------------------------------------------------------------------------
// Sản phẩm
// ---------------------------------------------------------------------------

export async function importProductsCsv(input: unknown): Promise<CsvImportResult> {
  try {
    const client = await createAdminClient()

    if (!isCsvTable(input)) return failure('Dữ liệu CSV không hợp lệ.')
    if (input.rows.length > MAX_CSV_ROWS) {
      return failure(`Tối đa ${MAX_CSV_ROWS} dòng mỗi lần nhập (file có ${input.rows.length}).`)
    }

    const { data: categories, error: categoryError } = await client
      .from('categories')
      .select('id, slug')
    if (categoryError) return failure(`Không đọc được danh mục: ${categoryError.message}`)

    const categoryIdBySlug = new Map<string, number>(
      (categories ?? []).map((category) => [String(category.slug).toLowerCase(), category.id as number])
    )

    const validation = validateProductRows(input, new Set(categoryIdBySlug.keys()))
    const rowErrors = collectErrors(validation)
    if (validation.fileErrors.length > 0) {
      return failure(validation.fileErrors[0], input.rows.length, rowErrors)
    }

    const rows = validRows(validation.rows)
    if (rows.length === 0) {
      return failure('Không có dòng hợp lệ để nhập.', input.rows.length, rowErrors)
    }

    const slugs = rows.map((row) => row.data.slug)
    const { data: existing, error: existingError } = await client
      .from('products')
      .select('id, slug')
      .in('slug', slugs)
    if (existingError) return failure(`Không đọc được sản phẩm hiện có: ${existingError.message}`)

    const existingIdBySlug = new Map<string, number>(
      (existing ?? []).map((product) => [String(product.slug), product.id as number])
    )
    // Id cố định cho từng dòng để vừa upsert vừa gắn ảnh chính.
    const finalIdBySlug = new Map<string, number>()
    for (const row of rows) {
      finalIdBySlug.set(row.data.slug, existingIdBySlug.get(row.data.slug) ?? newBigIntId())
    }

    const payload = rows.map(({ data }) => ({
      id: finalIdBySlug.get(data.slug)!,
      slug: data.slug,
      name: data.name,
      short_desc: data.short_desc,
      description: data.description,
      price: data.price,
      old_price: data.old_price,
      category_id: categoryIdBySlug.get(data.category_slug)!,
      weight: data.weight,
      featured_is: data.featured_is,
      sort_order: data.sort_order,
      status: data.status,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    }))

    // Upsert theo slug: dòng đã có → cập nhật, chưa có → tạo mới.
    const { error: upsertError } = await client
      .from('products')
      .upsert(payload, { onConflict: 'slug' })
    if (upsertError) return failure(`Nhập sản phẩm thất bại: ${upsertError.message}`)

    // Ảnh chính: chỉ cập nhật khi CSV có `image_url`.
    let warning: string | undefined
    const withImage = rows.filter((row) => row.data.image_url)
    if (withImage.length > 0) {
      try {
        const productIds = withImage.map((row) => finalIdBySlug.get(row.data.slug)!)
        const { data: primaries, error: primaryError } = await client
          .from('product_images')
          .select('id, product_id')
          .in('product_id', productIds)
          .eq('is_primary', true)
        if (primaryError) throw new Error(primaryError.message)

        const primaryIdByProduct = new Map<number, number>(
          (primaries ?? []).map((image) => [image.product_id as number, image.id as number])
        )

        const inserts: Array<Record<string, unknown>> = []
        const updates: Array<{ id: number; data: ProductImportData }> = []
        for (const row of withImage) {
          const productId = finalIdBySlug.get(row.data.slug)!
          const primaryId = primaryIdByProduct.get(productId)
          if (primaryId) updates.push({ id: primaryId, data: row.data })
          else {
            inserts.push({
              id: newBigIntId(),
              product_id: productId,
              url: row.data.image_url,
              alt: row.data.name,
              sort_order: 1,
              is_primary: true,
            })
          }
        }

        if (inserts.length > 0) {
          const { error } = await client.from('product_images').insert(inserts)
          if (error) throw new Error(error.message)
        }
        const results = await Promise.all(
          updates.map(({ id, data }) =>
            client
              .from('product_images')
              .update({ url: data.image_url, alt: data.name })
              .eq('id', id)
          )
        )
        const failed = results.find((result) => result.error)
        if (failed?.error) throw new Error(failed.error.message)
      } catch (error) {
        warning = `Sản phẩm đã lưu nhưng ảnh chưa cập nhật: ${
          error instanceof Error ? error.message : 'lỗi không xác định'
        }`
      }
    }

    const created = rows.filter((row) => !existingIdBySlug.has(row.data.slug)).length
    const updated = rows.length - created
    const skipped = input.rows.length - rows.length

    await logAudit({
      action: 'san-pham-import',
      table: 'products',
      record_id: String(rows.length),
      data: { created, updated, skipped },
    })
    revalidateCatalog()

    return { ok: true, created, updated, skipped, errors: rowErrors, warning }
  } catch (error) {
    return failure(error instanceof Error ? error.message : 'Nhập CSV thất bại.')
  }
}

// ---------------------------------------------------------------------------
// Danh mục
// ---------------------------------------------------------------------------

export async function importCategoriesCsv(input: unknown): Promise<CsvImportResult> {
  try {
    const client = await createAdminClient()

    if (!isCsvTable(input)) return failure('Dữ liệu CSV không hợp lệ.')
    if (input.rows.length > MAX_CSV_ROWS) {
      return failure(`Tối đa ${MAX_CSV_ROWS} dòng mỗi lần nhập (file có ${input.rows.length}).`)
    }

    const { data: existing, error: existingError } = await client
      .from('categories')
      .select('id, slug')
    if (existingError) return failure(`Không đọc được danh mục: ${existingError.message}`)

    const existingIdBySlug = new Map<string, number>(
      (existing ?? []).map((category) => [String(category.slug).toLowerCase(), category.id as number])
    )

    const validation = validateCategoryRows(input, new Set(existingIdBySlug.keys()))
    const rowErrors = collectErrors(validation)
    if (validation.fileErrors.length > 0) {
      return failure(validation.fileErrors[0], input.rows.length, rowErrors)
    }

    const rows = validRows(validation.rows)
    if (rows.length === 0) {
      return failure('Không có dòng hợp lệ để nhập.', input.rows.length, rowErrors)
    }

    // Id cho cả danh mục mới để có thể tham chiếu cha/con trong cùng file.
    const finalIdBySlug = new Map<string, number>(existingIdBySlug)
    for (const row of rows) {
      if (!finalIdBySlug.has(row.data.slug)) {
        finalIdBySlug.set(row.data.slug, newBigIntId())
      }
    }

    const payload = rows.map(({ data }) => ({
      id: finalIdBySlug.get(data.slug)!,
      name: data.name,
      slug: data.slug,
      parent_id: data.parent_slug ? finalIdBySlug.get(data.parent_slug) ?? null : null,
      sort_order: data.sort_order,
      active: data.active,
    }))

    const { error: upsertError } = await client
      .from('categories')
      .upsert(payload, { onConflict: 'slug' })
    if (upsertError) return failure(`Nhập danh mục thất bại: ${upsertError.message}`)

    const created = rows.filter((row) => !existingIdBySlug.has(row.data.slug)).length
    const updated = rows.length - created
    const skipped = input.rows.length - rows.length

    await logAudit({
      action: 'danh-muc-import',
      table: 'categories',
      record_id: String(rows.length),
      data: { created, updated, skipped },
    })
    revalidateCatalog()

    return { ok: true, created, updated, skipped, errors: rowErrors }
  } catch (error) {
    return failure(error instanceof Error ? error.message : 'Nhập CSV thất bại.')
  }
}
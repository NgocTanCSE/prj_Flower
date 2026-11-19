/**
 * Xuất dữ liệu admin ra CSV (tải trực tiếp, mở bằng Excel).
 *
 * GET /admin/api/export/products
 * GET /admin/api/export/categories
 *
 * Bảo vệ: middleware `/admin/*` + `requireAdmin()` (role = admin).
 * File có UTF-8 BOM để Excel hiển thị đúng tiếng Việt.
 */

import { createAdminClient, requireAdmin } from '@/app/admin/api/actions/auth'
import { toCsv, type CsvCell } from '@/lib/csv'
import { CATEGORY_CSV_HEADERS, PRODUCT_CSV_HEADERS } from '@/lib/csv-import'

export const dynamic = 'force-dynamic'

function csvResponse(csv: string, filename: string): Response {
  return new Response(`\uFEFF${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function errorResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string }> }
): Promise<Response> {
  try {
    await requireAdmin()
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Không có quyền truy cập.', 403)
  }

  const { type } = await context.params
  const date = new Date().toISOString().slice(0, 10)

  try {
    const client = await createAdminClient()

    if (type === 'products') {
      const [{ data: products, error }, { data: categories }, { data: images }] = await Promise.all([
        client
          .from('products')
          .select(
            'id, slug, name, short_desc, description, price, old_price, category_id, weight, featured_is, sort_order, status, is_active'
          )
          .order('sort_order')
          .order('id'),
        client.from('categories').select('id, slug'),
        client.from('product_images').select('product_id, url').eq('is_primary', true),
      ])

      if (error) return errorResponse(`Không đọc được sản phẩm: ${error.message}`, 500)

      const categorySlugById = new Map<number, string>(
        (categories ?? []).map((category) => [category.id as number, String(category.slug)])
      )
      const imageByProduct = new Map<number, string>(
        (images ?? []).map((image) => [image.product_id as number, String(image.url)])
      )

      const rows: CsvCell[][] = (products ?? []).map((product) => [
        product.slug,
        product.name,
        product.short_desc,
        product.description,
        product.price,
        product.old_price ?? '',
        categorySlugById.get(product.category_id as number) ?? '',
        product.weight ?? 0,
        product.featured_is ? 1 : 0,
        product.sort_order,
        product.status,
        product.is_active ? 1 : 0,
        imageByProduct.get(product.id as number) ?? '',
      ])

      return csvResponse(toCsv(PRODUCT_CSV_HEADERS, rows), `san-pham-${date}.csv`)
    }

    if (type === 'categories') {
      const { data: categories, error } = await client
        .from('categories')
        .select('id, name, slug, parent_id, sort_order, active')
        .order('sort_order')
        .order('id')

      if (error) return errorResponse(`Không đọc được danh mục: ${error.message}`, 500)

      const slugById = new Map<number, string>(
        (categories ?? []).map((category) => [category.id as number, String(category.slug)])
      )

      const rows: CsvCell[][] = (categories ?? []).map((category) => [
        category.slug,
        category.name,
        category.parent_id ? slugById.get(category.parent_id as number) ?? '' : '',
        category.sort_order,
        category.active ? 1 : 0,
      ])

      return csvResponse(toCsv(CATEGORY_CSV_HEADERS, rows), `danh-muc-${date}.csv`)
    }

    return errorResponse('Loại dữ liệu không hợp lệ. Chỉ hỗ trợ products, categories.', 404)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Xuất CSV thất bại.',
      500
    )
  }
}
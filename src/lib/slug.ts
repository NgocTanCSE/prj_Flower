/**
 * Sinh slug URL thân thiện từ tiếng Việt.
 *
 * Tách riêng khỏi `getProducts.ts` để các module thuần (CSV import) dùng được
 * ở cả client mà không kéo theo Supabase server client vào bundle.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
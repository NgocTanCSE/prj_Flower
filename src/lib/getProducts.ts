/**
 * Truy vấn dữ liệu công khai của Tiệm Hoa CoBeCuBe.
 *
 * SSR: gọi từ server component / server action, Supabase RLS cho phép
 * ngoại khóa đọc các dữ liệu công khai:
 *   - products: status = 'published' AND is_active = true
 *   - gallery_images: is_active = true
 *   - reviews: is_approved = true
 *   - categories, product_images, settings: SELECT toàn bộ
 *
 * Tên cột sinh ra đúng theo `supabase/migrations/0001_init.sql`.
 */
import { createClient } from './supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Kiểu dữ liệu
// ---------------------------------------------------------------------------

/** Thông tin chi tiết của một ảnh sản phẩm. */
export interface ProductImage {
  id: number
  product_id: number
  url: string
  alt: string
  sort_order: number
  is_primary: boolean
}

/** Thông tin sản phẩm, slug deterministic (hoa-1..hoa-8). */
export interface Product {
  id: number
  slug: string
  name: string
  short_desc: string
  description: string
  price: number
  old_price: number | null
  category_id: number
  weight: number | null
  featured_is: boolean
  sort_order: number
  status: 'draft' | 'published'
  views: number
  is_active: boolean
  created_at: string
  updated_at: string
  /** Ảnh của sản phẩm (liên kết từ bảng `product_images`). */
  product_images?: ProductImage[]
}

/** Danh mục hoa (phân cấp 1 cấp). */
export interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  sort_order: number
  active: boolean
}

/** Đánh giá sản phẩm đã được phê duyệt. */
export interface Review {
  id: number
  product_id: number
  customer_name: string
  customer_email: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
}

/** Ảnh gallery công khai. */
export interface GalleryImage {
  id: number
  url: string
  alt: string
  category: string
  sort_order: number
  is_active: boolean
  created_at: string
}

/** Cài đặt của site (`settings` table). */
export interface Setting {
  key: string
  value: string
}

/** Các khóa cài đặt tiêu chuẩn của site. */
export const SETTING_KEYS: Record<string, string> = {
  shop_name: 'Tên trang',
  about_text: 'Nội dung Giới thiệu',
  phone: 'SĐT',
  email: 'Email',
  address: 'Địa chỉ',
  business_hours: 'Giờ mở cửa',
  zalo_link: 'Link Zalo',
  messenger_link: 'Link Messenger',
  facebook_link: 'Facebook',
  instagram_link: 'Instagram',
  allow_orders: 'Cho phép đơn hàng',
  currency: 'Đơn vị tiền tệ',
  language: 'Ngôn ngữ',
  shipping_fee: 'Phí vận chuyển',
  free_shipping_min: 'Miễn vận chuyển từ',
  tax_rate: 'Thuế',
  cancel_policy: 'Chính sách hủy',
  delivery_note: 'Ghi chú giao hàng',
  seo_meta_title: 'SEO Title',
  seo_meta_description: 'SEO Description',
}

/** Các khoảng sắp xếp được cho phép ở bộ sưu tập. */
export type ProductSort = 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'

export interface ProductParams {
  page?: number
  perPage?: number
  category?: string
  sort?: ProductSort
  q?: string
  featured?: boolean
  minPrice?: number
  maxPrice?: number
}

export interface ProductListResult {
  items: Product[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Tự động sinh slug cho URL `/san-pham/[slug]` từ tên sản phẩm. */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Số lượng sản phẩm hiển thị mỗi trang. */
const PAGE_SIZE = 8

/**
 * Lấy client (anon) dùng cho yêu cầu đọc công khai của site / admin.
 *
 * Supabase chưa cấu hình (biến môi trường bỏ trống) → `null` trả về để trang
 * được render không phải gây lỗi `supabaseUrl is required.` lúc build.
 */
async function client(): Promise<SupabaseClient | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl) return null

  return createClient()
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Quyết định tất cả cài đặt (vẫn theo `key`). */
export async function getSettings(): Promise<Setting[]> {
  const supabase = await client()
  if (!supabase) return []
  const { data, error } = await supabase.from('settings').select('key, value').order('key')
  if (error) throw new Error(`Lỗi lấy cài đặt: ${error.message}`)
  return data ?? []
}

/** Đọc một cài đặt duy nhất. */
export async function getSetting(key: string): Promise<string> {
  const supabase = await client()
  if (!supabase) return ''
  const { data, error } = await supabase.from('settings').select('value').eq('key', key).limit(1).single()
  if (error) throw new Error(`Lỗi lấy cài đặt ${key}: ${error.message}`)
  return data?.value ?? ''
}

/** Đọc nhiều cài đặt theo danh sách `keys`. */
export async function getSettingsMany<T extends string>(keys: T[]): Promise<Record<T, string>> {
  const map = Object.assign(Object.fromEntries(keys.map((k) => [k, ''])), {}) as Record<T, string>
  const settings = await getSettings()
  for (const s of settings) {
    if (Object.prototype.hasOwnProperty.call(map, s.key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(map as Record<string, string>)[s.key] = s.value
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** Các danh mục đang hoạt động (hiển thị cho khách). */
export async function getCategories(): Promise<Category[]> {
  const supabase = await client()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('sort_order')
    .limit(20)

  if (error) throw new Error(`Lỗi lấy danh mục: ${error.message}`)
  return data ?? []
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** Đơn vị sắp xếp cho PostgREST. */
const SORT_MAP: Record<ProductSort, string> = {
  popular: 'views',
  'price-asc': 'price',
  'price-desc': 'price',
  'name-asc': 'name',
  'name-desc': 'name',
  newest: 'created_at',
}

/**
 * Chuyển đổi bộ lọc danh mục (slug ở URL) sang `category_id` để lọc bằng
 * PostgREST. Nhận `all` hoặc giá trị không hợp lệ => trả về `undefined`
 * (tức là không lọc theo danh mục).
 */
async function resolveCategory(category?: string): Promise<string | undefined> {
  if (!category || category === 'all') return undefined
  const supabase = await client()
  if (!supabase) return undefined

  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('active', true)
    .eq('slug', category)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Lỗi lấy danh mục: ${error.message}`)
  if (data?.id) return String(data.id)

  // Nhận dạng id trực tiếp (số nguyên) làm phụ trợ.
  if (/^\d+$/.test(category)) return category

  return undefined
}

/**
 * Danh sách sản phẩm công khai, phân trang + bộ lọc.
 */
export async function getProducts(params: ProductParams = {}): Promise<ProductListResult> {
  const { page = 1, perPage = PAGE_SIZE, category, sort = 'newest', q, featured = false, minPrice, maxPrice } = params

  const supabase = await client()
  if (!supabase) return { items: [], total: 0, page, perPage, hasMore: false }

  let query = supabase
    .from('products')
    // Lấy thông tin sản phẩm cùng danh sách ảnh liên kết
    .select('*, product_images(*)', {
      count: 'exact',
      head: false,
    })
    .eq('status', 'published')
    .eq('is_active', true)
    .order(SORT_MAP[sort] ?? 'created_at', {
      ascending: sort === 'price-asc' || sort === 'name-asc',
    })

  const catId = await resolveCategory(category)
  if (catId !== undefined) {
    query = query.eq('category_id', catId)
  }
  if (featured) {
    query = query.eq('featured_is', true)
  }
  if (minPrice !== undefined && minPrice > 0) {
    query = query.gte('price', minPrice)
  }
  if (maxPrice !== undefined && maxPrice > 0) {
    query = query.lte('price', maxPrice)
  }
  if (q) {
    // Escape ký tự đặc biệt để chống SQL nào (ILIKE an toàn).
    const keyword = q.replace(/[*+\[\]{}().|]/g, '')
    query = query.or(`name.ilike.*${keyword}*,short_desc.ilike.*${keyword}*,description.ilike.*${keyword}*`)
  }

  const { data, error, count } = await query.range((page - 1) * perPage, page * perPage - 1)

  if (error) throw new Error(`Lỗi lấy sản phẩm: ${error.message}`)
  const total = count ?? 0
  const pages = Math.max(1, Math.ceil(total / perPage))

  return {
    items: (data ?? []).map((p) => ({
      ...p,
      product_images: (p.product_images ?? []).sort((a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order),
    })),
    total,
    page,
    perPage,
    hasMore: page < pages,
  }
}

/** Sản phẩm nổi bật (`featured_is = true`). */
export async function getFeaturedProducts(count = 5): Promise<Product[]> {
  const supabase = await client()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('featured_is', true)
    .order('sort_order')
    .limit(count)

  if (error) throw new Error(`Lỗi lấy sản phẩm nổi bật: ${error.message}`)
  return (data ?? []).map((p) => ({
    ...p,
    product_images: (p.product_images ?? []).sort((a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order),
  }))
}

/** Lấy thông tin chi tiết sản phẩm theo slug (public). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await client()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error) throw new Error(`Lỗi lấy sản phẩm ${slug}: ${error.message}`)
  if (!data) return null
  return {
    ...data,
    product_images: (data.product_images ?? []).sort((a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order),
  }
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/** Đánh giá hiển thị của shop (đã phê duyệt). */
export async function getReviews(count = 6): Promise<Review[]> {
  const supabase = await client()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(count)

  if (error) throw new Error(`Lỗi lấy đánh giá: ${error.message}`)
  return data ?? []
}

/** Đánh giá theo sản phẩm chi tiết. */
export async function getProductReviews(productId: number): Promise<Review[]> {
  const supabase = await client()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Lỗi lấy đánh giá: ${error.message}`)
  return data ?? []
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

/** Ảnh gallery công khai (hoạt động). */
export async function getGalleryImages(category?: string): Promise<GalleryImage[]> {
  const supabase = await client()
  if (!supabase) return []
  let query = supabase.from('gallery_images').select('*').order('sort_order')
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw new Error(`Lỗi lấy ảnh gallery: ${error.message}`)
  return data ?? []
}

/**
 * Tất cả slug sản phẩm công khai (dùng để liệt kê URL, cho sitemap).
 * Lỗi / thiếu dữ liệu không được làm trắng trang: trả về `[]`.
 */
export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const supabase = await client()
    if (!supabase) return []
    const { data, error } = await supabase
      .from('products')
      .select('slug')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('sort_order')

    if (error) return []
    return (data ?? []).map((p) => p.slug)
  } catch {
    return []
  }
}

/** Định dạng tiền tệ Việt Nam. */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`
}

/** Định dạng bộ đếm. */
export function formatCount(count: number): string {
  return count.toLocaleString('vi-VN')
}

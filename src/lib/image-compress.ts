/**
 * Nén ảnh phía client trước khi upload lên Supabase Storage.
 *
 * Lý do: ảnh chụp từ điện thoại thường 3–5 MB, nhưng hiển thị trên web chỉ cần
 * cạnh dài ~1600–1920px. Upload nguyên bản khiến bucket `assets` (gói Free 1 GB)
 * nhanh đầy và trang tải chậm. Hàm này giải mã ảnh bằng `createImageBitmap`,
 * thu nhỏ giữ tỉ lệ rồi mã hoá lại thành WebP.
 *
 * Nguyên tắc an toàn:
 *   - CHỈ chạy trên trình duyệt (guard SSR) — không đụng gì tới Cloudflare Worker.
 *   - BỎ QUA GIF: canvas chỉ vẽ được frame đầu → sẽ mất animation.
 *   - BỎ QUA file nhỏ (< 400 KB) để không nén lại ảnh vốn đã tối ưu.
 *   - BỎ QUA nếu kết quả lớn hơn bản gốc.
 *   - LỖI bất kỳ → trả lại file gốc, không chặn thao tác upload.
 *   - Server vẫn giữ nguyên kiểm tra MIME + 5 MB (`src/lib/upload.ts`), không tin client.
 */

export interface CompressOptions {
  /** Cạnh dài tối đa (px). Ảnh lớn hơn được thu nhỏ, ảnh nhỏ hơn giữ nguyên. */
  maxSize?: number
  /** Chất lượng nén WebP (0–1). 0.82 là mức gần như không thấy khác biệt. */
  quality?: number
  /** File nhỏ hơn ngưỡng này (byte) được giữ nguyên. */
  minBytes?: number
}

export type CompressSkipReason =
  | 'not-image' // không phải file ảnh
  | 'animated' // GIF động — canvas sẽ làm mất animation
  | 'small' // đã đủ nhỏ
  | 'unsupported' // trình duyệt/SSR không hỗ trợ canvas/ImageBitmap
  | 'no-gain' // nén xong lại lớn hơn hoặc bằng bản gốc
  | 'error' // giải mã/mã hoá thất bại

export interface CompressResult {
  /** File để đem đi upload (có thể chính là file gốc). */
  file: File
  /** `true` nếu file đã được nén lại thành công. */
  compressed: boolean
  originalSize: number
  size: number
  /** Lý do bỏ qua khi `compressed === false`. */
  skipped?: CompressSkipReason
}

/** Bộ thông số dùng chung cho từng ngữ cảnh upload. */
export const COMPRESS_PRESETS = {
  /** Ảnh nền banner: cần rộng hơn để không vỡ khi phủ full màn hình. */
  hero: { maxSize: 1920, quality: 0.82, minBytes: 400 * 1024 },
  /** Ảnh sản phẩm: hiển thị trong khung ~800px, 1600px là dư. */
  product: { maxSize: 1600, quality: 0.82, minBytes: 400 * 1024 },
  /** Ảnh thư viện: cùng ngưỡng với sản phẩm. */
  gallery: { maxSize: 1600, quality: 0.82, minBytes: 400 * 1024 },
} as const satisfies Record<string, CompressOptions>

/** Đổi đuôi file sang đuôi tương ứng với MIME thực tế của blob. */
function renameForType(name: string, type: string): string {
  const base = name.replace(/\.[^./\\]+$/, '') || 'image'
  if (type === 'image/png') return `${base}.png`
  if (type === 'image/jpeg') return `${base}.jpg`
  return `${base}.webp`
}

/** `canvas.toBlob` dạng Promise; trả `null` nếu trình duyệt không mã hoá được. */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality)
    } catch {
      resolve(null)
    }
  })
}

/**
 * Nén một file ảnh. Luôn resolve (không throw) để nơi gọi không cần try/catch.
 *
 * @example
 * const { file, compressed, originalSize, size } = await compressImage(raw, COMPRESS_PRESETS.product)
 * if (compressed) console.log(`Giảm ${formatBytes(originalSize)} → ${formatBytes(size)}`)
 * formData.set('image', file)
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const { maxSize = 1600, quality = 0.82, minBytes = 400 * 1024 } = options
  const originalSize = file.size

  const skip = (skipped: CompressSkipReason): CompressResult => ({
    file,
    compressed: false,
    originalSize,
    size: originalSize,
    skipped,
  })

  // SSR guard: server action module có thể bị import ở cả hai phía.
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return skip('unsupported')
  }
  if (!file.type.startsWith('image/')) return skip('not-image')
  // GIF động: canvas chỉ giữ frame đầu → tuyệt đối không nén.
  if (file.type === 'image/gif') return skip('animated')
  if (file.size < minBytes) return skip('small')
  if (typeof createImageBitmap !== 'function') return skip('unsupported')

  let bitmap: ImageBitmap | null = null
  try {
    // `from-image`: áp dụng đúng hướng xoay EXIF của ảnh điện thoại.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

    const { width, height } = bitmap
    if (!width || !height) return skip('error')

    // Chỉ thu nhỏ, không bao giờ phóng to.
    const scale = Math.min(1, maxSize / Math.max(width, height))
    const targetWidth = Math.max(1, Math.round(width * scale))
    const targetHeight = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return skip('unsupported')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    // Không tô nền: giữ nguyên vùng trong suốt (WebP hỗ trợ alpha).
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    // Ưu tiên WebP; trình duyệt cũ có thể trả PNG (khi đó sẽ bị loại vì nặng hơn).
    const blob =
      (await canvasToBlob(canvas, 'image/webp', quality)) ??
      (await canvasToBlob(canvas, 'image/jpeg', quality))
    if (!blob || blob.size === 0) return skip('unsupported')
    // Nén không lợi → giữ bản gốc cho chất lượng tốt nhất.
    if (blob.size >= originalSize) return skip('no-gain')

    const output = new File([blob], renameForType(file.name, blob.type || 'image/webp'), {
      type: blob.type || 'image/webp',
      lastModified: Date.now(),
    })

    return { file: output, compressed: true, originalSize, size: output.size }
  } catch {
    // Ảnh hỏng / định dạng trình duyệt không giải mã được → upload nguyên bản.
    return skip('error')
  } finally {
    bitmap?.close()
  }
}

/** Định dạng byte cho thông báo UI: `4.2 MB`, `312 KB`. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}
import { defineCloudflareConfig } from '@opennextjs/cloudflare'

/**
 * Cấu hình OpenNext Cloudflare tối giản.
 *
 * Không bật `r2IncrementalCache` để tránh yêu cầu tạo R2 bucket trên gói Free.
 * Hệ quả: ISR/on-demand revalidation không được lưu bền vững giữa các request.
 */
export default defineCloudflareConfig({})

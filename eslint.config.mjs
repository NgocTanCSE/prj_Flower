/**
 * ESLint 9 (flat config) cho Next.js 15.
 *
 * Dự án chưa tổng hợp lại rules lint nào; đây là cấu hình tối thiểu, đủ để
 * `npm run lint` (`next lint`) chạy được trong CI/CD trên mọi kênh.
 *
 * Khi repo có danh sách rules (preferably `.eslintrc` legacy hoặc flat đây),
 * ghi đè file này ở đây sẽ hoạt động ngay.
 */
import nextPlugin from '@next/eslint-plugin-next'

export default [nextPlugin.flatConfig.recommended]

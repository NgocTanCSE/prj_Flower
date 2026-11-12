import { test, expect, Page } from '@playwright/test'

/**
 * Smoke test: đăng nhập admin -> duyệt/trao đổi đánh giá -> thêm ảnh vào thư viện
 * -> thêm sản phẩm (nơi có trang quản lý) -> kiểm tra endpoint y tế.
 *
 * Required on model (npm run test):
 *   BASE_URL=http://localhost:3000 npx playwright test e2e/1_auth.spec.ts
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000'
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@tiemhoacobecube.dev'
const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Password@1234'

/** Nhấp đăng nhập, tự động xử lý mọi trang login từ Supabase. */
async function adminLogin(page: Page) {
  if (!(await page.url().includes('/login'))) {
    return
  }

  await page.fill('input[name="email"]', EMAIL)
  await page.fill('input[name="password"]', PASSWORD)
  const submit = page.locator('form').first().locator('button[type="submit"]')
  await submit.click()
  await expect(page).toHaveURL(/\/admin\//, { timeout: 60_000 })
}

/** Kiểm tra trang admin đăng nhập rồi có thể nhìn thấy nội dung. */
async function passAdmin(page: Page) {
  await page.goto('/admin/danh-gia')
  await adminLogin(page)
  await expect(page.locator('table')).toBeVisible({ timeout: 20_000 })
}

test('authentication - admin has access', async ({ page }) => {
  await passAdmin(page)
})

test('review list is rendered', async ({ page }) => {
  await passAdmin(page)
  await page.goto('/admin/danh-gia')
  await expect(page.locator('table')).toBeVisible()
  // có một nút hành động (dự bị)
  await expect(page.locator('button').first()).toBeVisible()
})

test('view gallery + add an image', async ({ page }) => {
  await passAdmin(page)
  await page.goto('/admin/thu-vien')

  const fileInput = page.locator('input[type="file"][name="file"]')
  if (await fileInput.isVisible()) {
    await fileInput.setInputFiles('./e2e/fixtures/flower.png')
    await page.locator('input[name="alt"]').fill('Ảnh chấm nhỏ')
    await page.locator('input[name="thu_tu"]').fill('1')
    await page.locator('form').first().locator('button[type="submit"]').click()

    // upload lên storage và upsert vào bảng gallery
    await expect(page.locator('figure')).toBeVisible({ timeout: 30_000 })
  }
})

test('add product + view', async ({ page }) => {
  await passAdmin(page)
  await page.goto('/admin/products')

  const name = page.locator('input[name="ten"]')
  const canAdd = await name.isVisible()
  test.skip(!canAdd, 'chưa có trang quản lý sản phẩm')

  await name.fill('Bó Hoa Form')
  const price = page.locator('input[name="gia"]')
  if (await price.isVisible()) {
    await price.fill('450000')
  }

  const submit = page.locator('form').first().locator('button[type="submit"]')
  if (await submit.isVisible()) {
    await submit.click()
  }

  await expect(page.locator('table')).toBeVisible({ timeout: 30_000 })
})

test('health endpoint is healthy', async ({ request }) => {
  const res = await request.get('/api/health')
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body).toMatchObject({ status: 'ok' })
  expect(typeof body.elapsed_ms).toBe('number')
})

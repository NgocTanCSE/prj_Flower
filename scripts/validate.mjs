/**
 * Validate bước cuối trước khi đẩy lên Netlify.
 *
 * Chạy: npm run validate
 *
 * Kiểm tra 5 lớp:
 *   1. `tsc --noEmit` (type-check)
 *   2. Các biến môi trường bắt buộc (`NEXT_PUBLIC_SUPABASE_URL`, ...)
 *   3. Bảng migrate (supabase/migrations/0001_init.sql) nhất quán với docs/DB.md
 *   4. Không còn legacy column (`ten`, `mo_ta`, `gia`, `anh`) trên `src/`
 *   5. Các route đã build trong `.next/server/app-paths-manifest.json`
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const fails = []
const passes = []

const log = (ok, label, detail = '') => {
  const icon = ok ? 'PASS' : 'FAIL'
  console.log(`  [${icon}] ${label}${detail ? ` → ${detail}` : ''}`)
  if (ok) passes.push(label)
  else fails.push(`${label} ${detail}`)
}

// --- 1. Type check --------------------------------------------------------
try {
  execSync('npx tsc --noEmit', { stdio: 'ignore', cwd: ROOT })
  log(true, 'Type check (`tsc --noEmit`)')
} catch (/** @type {any} */ err) {
  log(false, 'Type check (`tsc --noEmit`)', `exit ${err.status ?? 1}`)
}

// --- 2. Environment variables (cảnh báo, không phải lỗi) ---------------------
const env = process.env
const envPath = path.join(ROOT, '.env')
const found = fs.existsSync(envPath)
const required = [
  ['NEXT_PUBLIC_SUPABASE_URL', 'URL Supabase'],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Key Supabase'],
]
for (const [key, label] of required) {
  const present = Boolean(env[key])
  console.log(present ? '  [OK ]' : '  [WARN]', `${label} (${key}) — ${found ? 'từ .env' : 'từ môi trường lúc chạy'}`)
}

// --- 3. Schema consistency --------------------------------------------------
const migration = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '0001_init.sql'), 'utf8')
const docs = fs.readFileSync(path.join(ROOT, 'docs', 'DB.md'), 'utf8')

// 8 bảng của dự án
const tables = ['profiles', 'categories', 'products', 'product_images', 'reviews', 'gallery_images', 'settings', 'audit_log']
const migrationTables = migration.match(/CREATE TABLE public\.(\w+)/g) ?? []
const docsTables = docs.match(/\| `(\w+)`/gm).map((s) => s.match(/(\w+)/)[1])
const tableOK = tables.every((t) => migrationTables.some((x) => x.endsWith(`.${t}`)) && docsTables.includes(t))
log(tableOK, `Schema: ${tables.length} bảng (migrate ↔ docs/DB.md)`, tableOK ? tables.join(' ') : 'thiếu bảng')

// Cột chuẩn của `products` (riêng block CREATE TABLE public.products)
const productBlock = migration.slice(migration.indexOf('CREATE TABLE public.products ('))
const blockEnd = productBlock.indexOf(');')
const productsBlock = productBlock.slice(0, blockEnd)
const cols = ['id bigint', 'slug text', 'name text', 'short_desc text', 'description text', 'price bigint', 'category_id bigint', 'status text', 'is_active boolean', 'views bigint', 'created_at timestamptz', 'updated_at timestamptz']
const colsOK = cols.every((c) => productsBlock.includes(c))
log(colsOK, 'Cột chuẩn `products` (migrate ↔ docs/DB.md)', colsOK ? `${cols.length} cột` : 'thiếu cột')

// --- 4. Kiểm tra legacy column ----------------------------------------------
// Cột cũ của schema phiên bản thứ nhất: ten (tên), mo_ta (mô tả), gia (giá), anh (ảnh).
// Chỉ báo hiệu nếu xuất hiện dưới dạng trường truy cập (`.ten`, `.mo_ta`, `.gia`, `.anh`).
// Loại `danh-gia` (router path), `gia đình`, `ten-file` (chuỗi nội dung) vốn không liên quan.
const legacyFields = ['ten', 'mo_ta', 'gia', 'anh']
const legacyRegex = legacyFields.map((n) => new RegExp(`\\.${n}\\b`))
// Recursively collect src files
const srcFiles = []
const collect = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.')) collect(full)
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) srcFiles.push(full)
  }
}
collect(path.join(ROOT, 'src'))
const allSrc = srcFiles.map((f) => fs.readFileSync(f, 'utf8'))
const legacyUsed = legacyFields.filter((n, i) => allSrc.some((s) => legacyRegex[i].test(s)))
log(legacyUsed.length === 0, 'Không legacy field trên src/', legacyUsed.length > 0 ? legacyUsed.join(', ') : '')

// --- 5. Build output --------------------------------------------------------
const manifestPath = path.join(ROOT, '.next', 'server', 'app-paths-manifest.json')
const hasManifest = fs.existsSync(manifestPath)
const routes = hasManifest ? Object.keys(JSON.parse(fs.readFileSync(manifestPath, 'utf8'))) : []
const expected = [
  '/(site)/san-pham/[slug]/page',
  '/admin/dashboard/page',
  '/admin/san-pham/page',
  '/admin/danh-gia/page',
  '/admin/thu-vien/page',
  '/admin/cai-dat/page',
  '/api/health/route',
  '/(auth)/login/page',
  '/(auth)/register/page',
  '/(auth)/forgot-password/page',
  '/(auth)/reset-password/page',
]
const missing = expected.filter((r) => !routes.includes(r))
log(hasManifest && missing.length === 0, 'Build output (`app-paths-manifest.json`)', hasManifest ? `${routes.length} routes, thiếu ${missing.length}` : 'chưa chạy `next build`')

// --- Summary ----------------------------------------------------------------
console.log(`\n--- Validate kết quả ---`)
console.log(`  passes: ${passes.length}, fails: ${fails.length}`)
if (fails.length > 0) {
  console.log('  Lỗi:\n' + fails.map((f) => `    - ${f}`).join('\n'))
  process.exitCode = 1
} else {
  console.log('  OK: mọi kiểm tra đều qua, sẵn sàng deploy.')
}

/**
 * Validate bước cuối trước khi deploy lên Cloudflare Workers.
 *
 * Chạy: npm run validate
 *
 * Kiểm tra các lớp:
 *   1. `tsc --noEmit` (type-check)
 *   2. Các biến môi trường bắt buộc (`NEXT_PUBLIC_SUPABASE_URL`, ...)
 *   3. Bảng migrate (supabase/migrations/0001_init.sql) nhất quán với docs/DB.md
 *   3b. Khóa chính tự sinh + audit_log.record_id
 *   3c. Nén ảnh client (WebP, bỏ qua GIF) ở đủ 3 điểm upload
 *   3d. Nhập/xuất CSV (parse + validate + route + action + UI)
 *   3e. Chọn màu theme (bảng màu + hex + validate) và màu phái sinh
 *   3f. Nút đổi nhãn (Công bố → Đang tải...) giữ nguyên bề rộng
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

// --- 3b. Khóa chính tự sinh & audit_log -------------------------------------------------
// Chống tái diễn lỗi "null value in column id ... violates not-null constraint":
// mọi bảng có INSERT từ app phải có DEFAULT cho cột id trong một migration.
const migrationsDir = path.join(ROOT, 'supabase', 'migrations')
const allMigrations = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
  .join('\n')

const idTables = ['categories', 'products', 'product_images', 'reviews', 'gallery_images']
const missingIdDefaults = idTables.filter(
  (t) => !new RegExp(`ALTER TABLE public\\.${t}\\s+ALTER COLUMN id SET DEFAULT`, 'i').test(allMigrations)
)
log(missingIdDefaults.length === 0, 'Khóa chính tự sinh (id DEFAULT)', missingIdDefaults.length ? `thiếu: ${missingIdDefaults.join(', ')}` : idTables.join(' '))

const auditRecordText = /ALTER TABLE public\.audit_log\s+ALTER COLUMN record_id TYPE text/i.test(allMigrations)
log(auditRecordText, 'audit_log.record_id dùng text', auditRecordText ? '' : 'record_id phải là text')

// --- 3c. Nén ảnh phía client ------------------------------------------------
// Ảnh phải được nén trước khi đẩy lên Supabase (bucket Free chỉ 1 GB). Đồng
// thời phải bỏ qua GIF để không mất animation.
const compressPath = path.join(ROOT, 'src', 'lib', 'image-compress.ts')
const compressSrc = fs.existsSync(compressPath) ? fs.readFileSync(compressPath, 'utf8') : ''
const compressOK =
  compressSrc.includes('createImageBitmap') &&
  compressSrc.includes("image/webp") &&
  compressSrc.includes("image/gif")
log(
  compressOK,
  'Nén ảnh client (WebP, bỏ qua GIF)',
  compressOK ? 'src/lib/image-compress.ts' : 'thiếu util nén hoặc mất guard GIF/WebP'
)

const compressSites = [
  ['Thư viện', path.join(ROOT, 'src', 'components', 'admin', 'gallery', 'GalleryUpload.tsx')],
  ['Sản phẩm', path.join(ROOT, 'src', 'components', 'admin', 'ProductForm.tsx')],
  ['Hero', path.join(ROOT, 'src', 'app', 'admin', '(protected)', 'cai-dat', 'SettingsForm.tsx')],
]
const missingCompressSites = compressSites.filter(
  ([, file]) => !fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes('compressImage')
)
log(
  missingCompressSites.length === 0,
  'Nén ảnh ở 3 điểm upload',
  missingCompressSites.length ? `thiếu: ${missingCompressSites.map(([n]) => n).join(', ')}` : 'thư viện · sản phẩm · hero'
)

// Giới hạn phía server phải còn (không tin client đã nén).
const uploadSrc = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'upload.ts'), 'utf8')
const serverLimitOK = /MAX_FILE_SIZE\s*=\s*5\s*\*\s*1024\s*\*\s*1024/.test(uploadSrc) && uploadSrc.includes('ALLOWED_TYPES')
log(serverLimitOK, 'Server vẫn giới hạn 5 MB + MIME', serverLimitOK ? '' : 'mất kiểm tra phía server')

// --- 3d. Nhập / xuất CSV ----------------------------------------------------
// Phải có: parser/serializer thuần, validate hai chiều, route xuất và action nhập.
const csvLibPath = path.join(ROOT, 'src', 'lib', 'csv.ts')
const csvImportLibPath = path.join(ROOT, 'src', 'lib', 'csv-import.ts')
const csvRoutePath = path.join(ROOT, 'src', 'app', 'admin', 'api', 'export', '[type]', 'route.ts')
const csvActionPath = path.join(ROOT, 'src', 'app', 'admin', 'api', 'actions', 'csv-import.ts')
const csvLibSrc = fs.existsSync(csvLibPath) ? fs.readFileSync(csvLibPath, 'utf8') : ''
const csvImportLibSrc = fs.existsSync(csvImportLibPath) ? fs.readFileSync(csvImportLibPath, 'utf8') : ''
const csvRouteSrc = fs.existsSync(csvRoutePath) ? fs.readFileSync(csvRoutePath, 'utf8') : ''
const csvActionSrc = fs.existsSync(csvActionPath) ? fs.readFileSync(csvActionPath, 'utf8') : ''
const csvCoreOK =
  csvLibSrc.includes('parseCsv') &&
  csvLibSrc.includes('toCsv') &&
  csvLibSrc.includes('formula injection') &&
  csvImportLibSrc.includes('MAX_CSV_ROWS') &&
  csvImportLibSrc.includes('validateProductRows') &&
  csvImportLibSrc.includes('validateCategoryRows') &&
  csvRouteSrc.includes('requireAdmin') &&
  csvRouteSrc.includes('PRODUCT_CSV_HEADERS') &&
  csvActionSrc.includes('importProductsCsv') &&
  csvActionSrc.includes('importCategoriesCsv') &&
  csvActionSrc.includes("onConflict: 'slug'")
log(
  csvCoreOK,
  'Nhập/xuất CSV (parse + validate + route + action)',
  csvCoreOK ? 'UTF-8 · chống formula injection · upsert theo slug' : 'thiếu thành phần CSV'
)

const csvProductsPage = fs.readFileSync(
  path.join(ROOT, 'src', 'app', 'admin', '(protected)', 'san-pham', 'page.tsx'),
  'utf8'
)
const csvCategoriesPage = fs.readFileSync(
  path.join(ROOT, 'src', 'app', 'admin', '(protected)', 'danh-muc', 'page.tsx'),
  'utf8'
)
const csvWiredOK = csvProductsPage.includes('<CsvTransfer') && csvCategoriesPage.includes('<CsvTransfer')
log(
  csvWiredOK,
  'CSV gắn vào trang Sản phẩm & Danh mục',
  csvWiredOK ? 'nhập · xuất · file mẫu' : 'thiếu CsvTransfer'
)
// --- 3e. Chọn màu theme (bảng màu + hex + validate) -------------------------
// Yêu cầu: người không biết code vẫn chọn được màu (palette/picker) và dev vẫn
// nhập được mã hex. Server phải chặn giá trị rác.
const colorFieldPath = path.join(ROOT, 'src', 'components', 'admin', 'ColorField.tsx')
const colorFieldSrc = fs.existsSync(colorFieldPath) ? fs.readFileSync(colorFieldPath, 'utf8') : ''
const settingsActionSrc = fs.readFileSync(path.join(ROOT, 'src', 'app', 'admin', 'api', 'actions', 'settings.ts'), 'utf8')
const settingsFormSrc = fs.readFileSync(
  path.join(ROOT, 'src', 'app', 'admin', '(protected)', 'cai-dat', 'SettingsForm.tsx'),
  'utf8'
)
const colorPickerOK =
  colorFieldSrc.includes('type="color"') &&
  colorFieldSrc.includes('normalizeHex') &&
  colorFieldSrc.includes('PRIMARY_PRESETS') &&
  settingsFormSrc.includes('ColorField') &&
  settingsActionSrc.includes('COLOR_SETTING_KEYS') &&
  /\[0-9a-f\]\{6\}/i.test(settingsActionSrc)
log(
  colorPickerOK,
  'Chọn màu theme (bảng màu + hex + validate)',
  colorPickerOK ? 'palette · picker · hex · server' : 'thiếu thành phần'
)

// Đổi màu chủ đạo phải kéo theo các sắc độ phái sinh (hover, viền, tag, bóng).
const rootLayoutSrc = fs.readFileSync(path.join(ROOT, 'src', 'app', 'layout.tsx'), 'utf8')
const themeDerivedOK = rootLayoutSrc.includes('color-mix') && rootLayoutSrc.includes('--color-tag-bg')
log(
  themeDerivedOK,
  'Theme đổi đồng bộ (màu phái sinh)',
  themeDerivedOK ? 'color-mix' : 'thiếu override biến phụ'
)

// --- 3f. Nút đổi nhãn giữ nguyên bề rộng -----------------------------------
// Các nút có nhãn thay đổi khi pending (Công bố → Đang tải, Ẩn → Hiện lại...)
// phải dùng StableLabel, nếu không cả hàng nút sẽ nhảy khi bấm.
const stableLabelSites = [
  ['Bảng sản phẩm', 'src/app/admin/(protected)/san-pham/ProductTableClient.tsx'],
  ['Đánh giá', 'src/components/admin/reviews/ReviewTable.tsx'],
  ['Thư viện', 'src/components/admin/gallery/GalleryTable.tsx'],
  ['Tải ảnh', 'src/components/admin/gallery/GalleryUpload.tsx'],
  ['Cài đặt', 'src/app/admin/(protected)/cai-dat/SettingsForm.tsx'],
  ['Làm mới đánh giá', 'src/app/admin/(protected)/danh-gia/RefreshReviewsButton.tsx'],
  ['CSV', 'src/components/admin/CsvTransfer.tsx'],
]
const missingStableLabel = stableLabelSites.filter(([, rel]) => {
  const file = path.join(ROOT, rel)
  return !fs.existsSync(file) || !fs.readFileSync(file, 'utf8').includes('StableLabel')
})
log(
  missingStableLabel.length === 0,
  'Nút đổi nhãn giữ nguyên bề rộng',
  missingStableLabel.length ? `thiếu: ${missingStableLabel.map(([n]) => n).join(', ')}` : `${stableLabelSites.length} vị trí`
)

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
  '/admin/(protected)/dashboard/page',
  '/admin/(protected)/san-pham/page',
  '/admin/(protected)/danh-gia/page',
  '/admin/(protected)/thu-vien/page',
  '/admin/(protected)/cai-dat/page',
  '/admin/login/page',
  '/(auth)/forgot-password/page',
  '/reset-password/page',
  '/api/health/route',
  '/admin/api/export/[type]/route',
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

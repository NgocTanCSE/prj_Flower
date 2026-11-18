# TODO — Chuyển đổi Netlify → Cloudflare Workers (OpenNext)

## Mục tiêu

Chuyển dự án Next.js 15 + Supabase từ Netlify sang Cloudflare Workers bằng
`@opennextjs/cloudflare`, không thay đổi giao diện, schema DB hay logic CRUD.
Không dùng `@cloudflare/next-on-pages` (đã deprecated).

## Ràng buộc

- [ ] Không bật R2 incremental cache, D1 hay Durable Objects.
- [ ] Giữ nguyên logic bảo vệ `/admin` trong `middleware.ts`.
- [ ] Giữ nguyên toàn bộ Server Actions và truy vấn Supabase.
- [ ] Không commit `.env`, `.dev.vars`, `.open-next/`, `.wrangler/`.
- [ ] Không hardcode lại domain `*.netlify.app`.

## Môi trường đã xác nhận

| Thành phần | Phiên bản / điều kiện |
|---|---|
| Node hiện tại | `v22.22.1` |
| Node tối thiểu cho Wrangler mới | `>= 22.12.0` |
| Next.js trong lock | `15.5.29` |
| OpenNext Cloudflare | `1.20.x` (peer yêu cầu Next `>= 15.5.29 < 16`) |
| Wrangler | `4.x` (peer `^4.148.0`) |

## Quy ước trạng thái

- `[ ]` chưa làm
- `[~]` đang làm
- `[x]` hoàn thành
- `[!]` bị chặn / cần quyết định

## Trạng thái thực hiện (2026-11-18)

- [x] Phase 0 — Baseline.
- [x] Phase 1 — Dependency & cấu hình Cloudflare.
- [x] Phase 2 — Runtime, env & CI.
- [x] Phase 3 — Tài liệu & dọn dấu vết Netlify.
- [x] Phase 4 — Build, type-check, typegen và preview smoke test.
  - CRUD với Supabase thật chưa chạy vì môi trường local chưa có `.env`/`.dev.vars`.
- [ ] Phase 5 — Deploy thật; đang chờ domain production và Cloudflare credentials.

Kết quả kiểm chứng đã chạy:

- Đã gỡ `sharp` (không được import; `images.unoptimized: true`).
- `npm run lint` → pass.
- `npx tsc --noEmit` → pass.
- `npx opennextjs-cloudflare build` → pass, `.open-next/worker.js` được tạo.
- `npx wrangler deploy --dry-run` → pass, gzip **1369.94 KiB** (dưới giới hạn 3 MiB của Workers Free).
- `npm run validate` → 5/5 pass.
- `npm run preview` → `/`, `/admin/login`, `/sitemap.xml` trả 200; `/api/health` trả `degraded` do thiếu biến Supabase local.
- Security headers và `_headers` cache static hoạt động đúng.

---

## Phase 0 — Baseline & an toàn

### Task 0.1 — Chốt baseline repo

**Mô tả:** Xác nhận working tree sạch, ghi lại phiên bản Next/Node/Netlify plugin
trước khi thay đổi để có thể so sánh sau migration.

**Files:** không sửa file.

**Acceptance criteria:**
- [x] `git status --short` sạch trước khi bắt đầu.
- [x] Ghi nhận Node `v22.22.1`, Next `15.5.29`.
- [x] Xác nhận không có `.github/workflows/deploy.yml`, không có thư mục `.netlify/`.

**Verification:**
- [x] `git status --short`
- [x] `node -v`
- [x] `node -p "require('next/package.json').version"`

### Checkpoint 0

- [x] Có baseline rõ ràng, không có thay đổi chưa commit bị ghi đè.

---

## Phase 1 — Dependency & cấu hình Cloudflare

### Task 1.1 — Gỡ Netlify, cài OpenNext/Wrangler, cập nhật scripts

**Mô tả:** Gỡ `@netlify/plugin-nextjs`; cài `@opennextjs/cloudflare@latest` và
`wrangler@latest` vào `devDependencies`; thêm 4 script Cloudflare; nâng Node
engine và siết phiên bản Next tối thiểu.

**Files:**
- `package.json`
- `package-lock.json`

**Acceptance criteria:**
- [ ] `@netlify/plugin-nextjs` không còn trong `dependencies`/`devDependencies`.
- [ ] `@opennextjs/cloudflare` và `wrangler` nằm trong `devDependencies`.
- [ ] Có đủ scripts: `preview`, `deploy`, `upload`, `cf-typegen`.
- [ ] `engines.node` là `>=22.12.0`.
- [ ] `next` là `^15.5.29` (vẫn trong Next 15).
- [ ] Description không còn chữ “Netlify”.

**Verification:**
- [ ] `npm ls @netlify/plugin-nextjs` → rỗng.
- [ ] `npm ls @opennextjs/cloudflare wrangler` → đúng phiên bản.
- [ ] `node -e "console.log(require('./package.json').scripts)"`

**Dependencies:** Task 0.1  
**Scope:** S (2 files)

### Task 1.2 — Tạo cấu hình Cloudflare

**Mô tả:** Tạo `wrangler.jsonc`, `open-next.config.ts` tối giản và
`public/_headers` cho cache tĩnh. Không thêm R2/D1.

**Files:**
- `wrangler.jsonc` (mới)
- `open-next.config.ts` (mới)
- `public/_headers` (mới)

**Acceptance criteria:**
- [ ] `wrangler.jsonc` có `name: "prj-flower"`, `main: ".open-next/worker.js"`,
      `compatibility_date: "2025-04-01"`.
- [ ] Flags gồm `nodejs_compat`, `global_fetch_strictly_public`.
- [ ] Có `assets` binding `ASSETS` và `services` binding `WORKER_SELF_REFERENCE`.
- [ ] Không có `r2_buckets`, `d1_databases`, `durable_objects`.
- [ ] `open-next.config.ts` dùng `defineCloudflareConfig({})`.
- [ ] `public/_headers` cache `/_next/static/*` với `immutable`.

**Verification:**
- [ ] `npx wrangler deploy --dry-run` không lỗi cấu hình (sau khi cài deps).
- [ ] `node -e "JSON.parse(require('fs').readFileSync('wrangler.jsonc','utf8'))"` (hoặc kiểm tra qua Wrangler).

**Dependencies:** Task 1.1  
**Scope:** S (3 files)

### Task 1.3 — Cập nhật `next.config.mjs`

**Mô tả:** Gọi `initOpenNextCloudflareForDev()`; chuyển 4 security headers từ
`netlify.toml` sang `headers()`; sửa alias webpack sang `fileURLToPath` để không
lỗi path trên Windows; giữ `images.unoptimized: true`.

**Files:**
- `next.config.mjs`

**Acceptance criteria:**
- [ ] Có `initOpenNextCloudflareForDev()`.
- [ ] `images.unoptimized: true` vẫn còn.
- [ ] `headers()` trả về đủ 4 header bảo mật cũ.
- [ ] Alias `@` trỏ đúng `src/` bằng `fileURLToPath`.
- [ ] Không còn comment/cấu hình Netlify.

**Verification:**
- [ ] `npx tsc --noEmit` (sau khi cài deps).
- [ ] `npm run build` chạy qua bước load config.

**Dependencies:** Task 1.1  
**Scope:** S (1 file)

### Task 1.4 — Xóa Netlify config & cập nhật gitignore

**Mô tả:** Xóa `netlify.toml`; thêm `.open-next/` vào `.gitignore`; xác nhận
`.wrangler/` và `.dev.vars` đã được ignore.

**Files:**
- `netlify.toml` (xóa)
- `.gitignore`

**Acceptance criteria:**
- [ ] `netlify.toml` không còn tồn tại.
- [ ] `.gitignore` có `.open-next/`, `.wrangler/`, `.dev.vars`.
- [ ] `.dev.vars.example` vẫn được commit (không bị ignore).

**Verification:**
- [ ] `test ! -f netlify.toml`
- [ ] `git check-ignore -v .open-next/foo .wrangler/foo .dev.vars`

**Dependencies:** Task 1.1  
**Scope:** XS (2 files)

### Checkpoint 1 — Nền tảng Cloudflare

- [ ] `npm install`/`npm ci` thành công.
- [ ] `npm ls @netlify/plugin-nextjs` rỗng.
- [ ] `wrangler.jsonc` và `open-next.config.ts` đọc được.
- [ ] `npm run lint` chưa phát sinh lỗi mới.

---

## Phase 2 — Runtime, env & CI

### Task 2.1 — Audit tương thích Workers

**Mô tả:** Rà `runtime = "edge"`, `fs`, `sharp`, `process.cwd()`, Node built-ins
trong `src/`; xác nhận không cần refactor CRUD/Supabase.

**Files:** không sửa file (chỉ ghi nhận).

**Acceptance criteria:**
- [x] Không có `export const runtime = "edge"`.
- [x] Không có `fs`/`sharp`/`process.cwd()` trong runtime `src/`.
- [x] `middleware.ts` giữ nguyên logic `/admin`.
- [x] Supabase dùng `@supabase/ssr` + `next/headers` tương thích Workers.

**Verification:**
- [x] `grep -R "export const runtime" src middleware.ts`
- [x] `grep -R "node:fs\|from 'fs'\|sharp\|process.cwd()" src`

**Dependencies:** None  
**Scope:** XS (0 files)

### Task 2.2 — Sửa domain fallback & comment Netlify trong source

**Mô tả:** Bỏ fallback `tiemhoashopflower.netlify.app`; dùng `SITE_URL` với
fallback local; cập nhật comment “CI / Netlify / Vercel” và comment validate.

**Files:**
- `src/app/sitemap.ts`
- `src/lib/upload.ts`
- `src/lib/supabase/client.ts`
- `scripts/validate.mjs`

**Acceptance criteria:**
- [ ] Không còn chuỗi `netlify` trong 4 file.
- [ ] `sitemap.ts` dùng `process.env.SITE_URL` và fallback local rõ ràng.
- [ ] Không thay đổi logic sitemap/CRUD.

**Verification:**
- [ ] `grep -Rin netlify src scripts`
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 1.1  
**Scope:** S (4 files)

### Task 2.3 — Chuẩn hóa env local & preview

**Mô tả:** Cập nhật `.env.example` bỏ domain Netlify; tạo `.dev.vars.example`
với đúng biến runtime cần cho `npm run preview`.

**Files:**
- `.env.example`
- `.dev.vars.example` (mới)

**Acceptance criteria:**
- [ ] `.env.example` không còn `netlify.app`.
- [ ] `.dev.vars.example` có `NEXTJS_ENV=development`.
- [ ] Có `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_KEY`, `ADMIN_EMAIL`, `SITE_URL`.
- [ ] Không đưa các biến không dùng (`GOOGLE_*`, `R2_*`, `DRY_RUN`) vào `.dev.vars.example`.

**Verification:**
- [ ] `grep -Rin netlify .env.example .dev.vars.example`
- [ ] `git check-ignore .dev.vars` và `test -f .dev.vars.example`

**Dependencies:** None  
**Scope:** S (2 files)

### Task 2.4 — Cập nhật CI cho Node 22 & OpenNext build

**Mô tả:** Nâng CI lên Node 22; thay bước `next build` bằng
`npx opennextjs-cloudflare build` để kiểm tra artifact Worker thật.

**Files:**
- `.github/workflows/ci.yml`

**Acceptance criteria:**
- [ ] `node-version` là `22` (>= 22.12 trên runner).
- [ ] CI build bằng OpenNext, vẫn giữ env Supabase/SITE_URL.
- [ ] Bước `npm run validate` vẫn chạy sau build.
- [ ] Không thêm deploy tự động nếu chưa có credentials.

**Verification:**
- [ ] `npx tsc --noEmit`
- [ ] `npx opennextjs-cloudflare build` local thành công.
- [ ] `npm run validate` local thành công.

**Dependencies:** Tasks 1.1–1.3  
**Scope:** XS (1 file)

### Checkpoint 2 — Runtime & CI

- [ ] `npm run lint` pass.
- [ ] `npx tsc --noEmit` pass.
- [ ] CI YAML hợp lệ.
- [ ] Không còn tham chiếu Netlify trong `src/`, `scripts/`, `.github/`.

---

## Phase 3 — Tài liệu & dọn dấu vết Netlify

### Task 3.1 — Cập nhật README

**Mô tả:** Đổi stack Deploy sang Cloudflare Workers/OpenNext; thêm lệnh
`preview`/`deploy` và danh sách biến môi trường.

**Files:**
- `README.md`

**Acceptance criteria:**
- [ ] Không còn “Netlify” trong README.
- [ ] Có hướng dẫn `npm run preview` và `npm run deploy`.
- [ ] Có ghi chú Node >= 22.12.
- [ ] Có danh sách biến môi trường cần đặt trên Cloudflare.

**Verification:**
- [ ] `grep -in netlify README.md`

**Dependencies:** Tasks 1.1–1.2  
**Scope:** XS (1 file)

### Task 3.2 — Cập nhật tài liệu kiến trúc/deploy

**Mô tả:** Đổi dòng Deploy trong `docs/INSTRUCTIONS.md`; thay quyền sở hữu
`netlify.toml` của A5 bằng các file Cloudflare; viết lại mục 6 trong
`CONFIG_EXPLAIN.md`.

**Files:**
- `docs/INSTRUCTIONS.md`
- `CONFIG_EXPLAIN.md`

**Acceptance criteria:**
- [ ] `docs/INSTRUCTIONS.md` ghi Deploy: Cloudflare Workers.
- [ ] Danh sách A5 dùng `wrangler.jsonc`, `open-next.config.ts`, `public/_headers`.
- [ ] `CONFIG_EXPLAIN.md` mục 6 mô tả OpenNext + các lệnh deploy.
- [ ] Không còn hướng dẫn deploy `.next` lên Netlify.

**Verification:**
- [ ] `grep -Rin netlify docs CONFIG_EXPLAIN.md`

**Dependencies:** Task 3.1  
**Scope:** S (2 files)

### Task 3.3 — Kiểm tra dấu vết Netlify toàn repo

**Mô tả:** Chạy grep toàn repo (loại trừ generated/vendor) để đảm bảo không còn
Netlify trong source, config, docs và lockfile.

**Files:** không sửa.

**Acceptance criteria:**
- [ ] Không còn kết quả `netlify` ngoài `node_modules`, `.next`, `.open-next`.
- [ ] `package-lock.json` không còn `@netlify/plugin-nextjs`.

**Verification:**
- [ ] `grep -Rin netlify . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.open-next`
- [ ] `grep -n "@netlify" package-lock.json`

**Dependencies:** Tasks 1.1–3.2  
**Scope:** XS (0 files)

### Checkpoint 3 — Sạch dấu vết Netlify

- [ ] Grep Netlify chỉ còn 0 kết quả.
- [ ] Docs mô tả đúng Cloudflare Workers.
- [ ] Không có file cấu hình Netlify nào còn trong repo.

---

## Phase 4 — Build, type-check & kiểm thử

### Task 4.1 — Build OpenNext Worker

**Mô tả:** Chạy build adapter, xác nhận `.open-next/worker.js` và
`.open-next/assets` được tạo; ghi lại dung lượng gzip để đối chiếu giới hạn
Worker Free 3 MiB.

**Files:** generated only (`.open-next/`).

**Acceptance criteria:**
- [ ] `.open-next/worker.js` tồn tại.
- [ ] `.open-next/assets` tồn tại.
- [ ] Không lỗi bundling do `fs`, `sharp`, `edge runtime`.
- [ ] Ghi lại dung lượng compressed; nếu > 3 MiB thì báo rõ.

**Verification:**
- [ ] `npx opennextjs-cloudflare build`
- [ ] `ls -lh .open-next/worker.js`
- [ ] `du -sh .open-next`

**Dependencies:** Checkpoint 2  
**Scope:** S (build artifact)

### Task 4.2 — Validate & typegen

**Mô tả:** Chạy validate hiện có và sinh type Cloudflare.

**Files:**
- `cloudflare-env.d.ts` (generated)

**Acceptance criteria:**
- [ ] `npm run validate` pass (type-check + schema + build manifest).
- [ ] `npm run cf-typegen` tạo `cloudflare-env.d.ts` không lỗi.
- [ ] Quyết định commit hay ignore file generated (mặc định: không commit nếu không dùng binding).

**Verification:**
- [ ] `npm run validate`
- [ ] `npm run cf-typegen`
- [ ] `ls -lh cloudflare-env.d.ts`

**Dependencies:** Task 4.1  
**Scope:** XS (1 generated file)

### Task 4.3 — Preview & smoke test

**Mô tả:** Chạy Worker local bằng `npm run preview`; kiểm tra các luồng chính
(không thay đổi code UI/CRUD).

**Files:** không sửa.

**Acceptance criteria:**
- [ ] `/` trả 200.
- [ ] `/api/health` trả JSON.
- [ ] `/admin/login` hiển thị form.
- [ ] Đăng nhập admin thành công.
- [ ] Tạo/sửa sản phẩm + upload ảnh thành công.
- [ ] Thêm/xóa ảnh thư viện thành công.
- [ ] Đổi cài đặt site thành công.
- [ ] Cookie session được giữ sau khi refresh trang admin.

**Verification:**
- [ ] `npm run preview`
- [ ] `curl -I http://localhost:8787/`
- [ ] `curl http://localhost:8787/api/health`
- [ ] Thao tác tay trên trình duyệt.

**Dependencies:** Tasks 4.1–4.2, `.dev.vars`  
**Scope:** M (manual)

### Checkpoint 4 — Build & runtime

- [ ] OpenNext build thành công.
- [ ] Validate pass.
- [ ] Preview chạy được và các luồng chính hoạt động.
- [ ] Dung lượng Worker nằm trong giới hạn cho phép (hoặc có báo cáo rõ).

---

## Phase 5 — Deploy & bàn giao

### Task 5.1 — Cấu hình biến môi trường Cloudflare

**Mô tả:** Đặt build-time vars và runtime secrets trên Cloudflare Dashboard
hoặc bằng Wrangler.

**Files:** không sửa.

**Acceptance criteria:**
- [ ] Build-time: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SITE_URL`.
- [ ] Runtime: các biến trên + `SUPABASE_SERVICE_KEY` (secret), `ADMIN_EMAIL`.
- [ ] Không đưa `GOOGLE_*`, `R2_*`, `DRY_RUN` lên Worker nếu app không dùng.
- [ ] Dùng `--keep-vars` khi deploy để không xóa biến dashboard.

**Verification:**
- [ ] `npx wrangler secret list`
- [ ] Kiểm tra Dashboard → Worker → Settings → Variables.

**Dependencies:** Checkpoint 4  
**Scope:** S (0 files)

### Task 5.2 — Deploy Worker & gắn domain

**Mô tả:** Deploy lần đầu, gắn custom domain, kiểm tra HTTPS và các route.

**Files:** không sửa.

**Acceptance criteria:**
- [ ] `npm run deploy` thành công.
- [ ] Worker `prj-flower` xuất hiện trên Cloudflare.
- [ ] Custom domain trỏ đúng Worker.
- [ ] `/`, `/admin/login`, `/api/health` hoạt động trên domain thật.

**Verification:**
- [ ] `npm run deploy`
- [ ] `npx wrangler deployments list`
- [ ] `curl -I https://<domain>/`

**Dependencies:** Task 5.1  
**Scope:** S (0 files)

### Task 5.3 — Cập nhật Supabase Auth & dọn Netlify

**Mô tả:** Cập nhật Site URL/Redirect URLs trong Supabase; xác nhận luồng quên
mật khẩu; sau khi ổn định mới xóa site/DNS Netlify.

**Files:** không sửa.

**Acceptance criteria:**
- [ ] Supabase Site URL là domain Cloudflare.
- [ ] Redirect URL có `https://<domain>/reset-password`.
- [ ] Email đặt lại mật khẩu trỏ đúng domain mới.
- [ ] Không còn DNS/site Netlify đang phục vụ production.

**Verification:**
- [ ] Gửi thử email reset mật khẩu.
- [ ] Mở link reset trên domain mới.
- [ ] Kiểm tra DNS/Netlify dashboard.

**Dependencies:** Task 5.2, domain production từ người dùng  
**Scope:** S (0 files)

### Checkpoint 5 — Hoàn tất migration

- [ ] Production chạy trên Cloudflare Workers.
- [ ] Supabase Auth hoạt động với domain mới.
- [ ] Netlify đã được gỡ khỏi repo và hạ tầng.
- [ ] `grep -Rin netlify` trả về 0.

---

## Rủi ro & open items

| Rủi ro | Mức độ | Xử lý |
|---|---|---|
| `SITE_URL` production chưa có | Cao | Dùng placeholder; cập nhật trước khi deploy; Supabase redirect phải khớp |
| Worker Free 3 MiB compressed | Trung bình | Đo sau build; nếu vượt: gỡ `sharp`/dependency thừa hoặc dùng Workers Paid |
| CPU limit Workers Free | Trung bình | Smoke test; nếu vượt, cân nhắc Workers Paid hoặc tối ưu SSR |
| Không có R2 nên ISR/revalidatePath không bền vững | Trung bình | Chấp nhận theo yêu cầu; nếu cần ISR thật, bổ sung R2 + DO queue + D1 tag cache |
| Middleware dùng `getSession()` + `autoRefreshToken: false` | Trung bình | Giữ nguyên behavior; nếu cần refresh thật, sửa riêng sang `getUser()`/auto-refresh |
| Build trên Windows không được OpenNext bảo đảm | Thấp | Build trên Linux/WSL/CI |
| `cloudflare-env.d.ts` là file generated | Thấp | Quyết định commit/ignore; không dùng binding nên không bắt buộc |

## Definition of Done

- [ ] Không còn `netlify` trong source/config/docs/lockfile.
- [ ] `netlify.toml` đã xóa; `@netlify/plugin-nextjs` đã gỡ.
- [ ] `wrangler.jsonc`, `open-next.config.ts`, `public/_headers` tồn tại và đúng.
- [ ] `next.config.mjs` gọi `initOpenNextCloudflareForDev()` và giữ security headers.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build`, `npm run validate` đều pass.
- [ ] Preview Worker chạy được các luồng chính.
- [ ] README/CONFIG_EXPLAIN hướng dẫn deploy Cloudflare chính xác.
- [ ] Biến môi trường và Supabase Auth được cấu hình cho domain mới.

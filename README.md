# Tiệm Hoa Shop Flower

Website SSR thương mại cho tiệm hoa.

## Stack

| Thành phần | Chọn | Vì sao |
|---|---|---|
| Frontend | **Next.js 15** (App Router, TypeScript, Tailwind) | SSR, SEO, Server Actions |
| DB/Auth/Storage | **Supabase** (Postgres + Auth + RLS + Storage) | Tạo trong 10 phút, free tier |
| Deploy | **Cloudflare Workers** (`@opennextjs/cloudflare`) | SSR Node runtime, free tier |
| Lưu trữ ảnh | Supabase Storage | tự lưu, CDN |

## Production

- URL: **https://prj-flower.flowershop.workers.dev**
- Worker: `prj-flower` trên Cloudflare Workers
- Build: `opennextjs-cloudflare build` → `.open-next/worker.js` + `.open-next/assets`
- Runtime: Cloudflare Workers + static assets; không dùng R2/D1/Durable Objects
- Auth: Supabase Auth + `middleware.ts` bảo vệ `/admin`
- Cloudflare Access/Zero Trust: **không bật** cho site public

## Deploy (Cloudflare Workers)

```bash
npm run preview   # build + chạy Worker local
npm run deploy    # build + deploy lên Cloudflare
npm run upload    # build + upload một version mới
npm run cf-typegen
```

Yêu cầu Node >= 22.12.0.

Build-time (đọc từ `.env.local` khi deploy từ máy):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SITE_URL`

Runtime secrets/vars trên Worker:

- `SUPABASE_SERVICE_KEY` (secret, chỉ dùng server-side)
- `ADMIN_EMAIL`
- `SITE_URL` (phải khớp domain Worker)

`NEXT_PUBLIC_*` được inline vào bundle lúc build. **Không đặt `SUPABASE_SERVICE_KEY` trong `.env.local`**; thêm bằng:

```bash
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put ADMIN_EMAIL
```

### Cloudflare Access / Zero Trust

Không cần bật cho dự án này. Access là lớp đăng nhập bổ sung trước toàn bộ Worker; nếu bật cho site public, khách sẽ bị chặn bởi Cloudflare trước khi vào web. App đã tự bảo vệ `/admin` bằng Supabase Auth + `middleware.ts`.

## Quản lý

- **Admin:** `/admin` — Login, thêm/sửa sản phẩm, danh mục, đánh giá, hình ảnh, cài đặt site (SĐT, Zalo, Messenger, địa chỉ, giờ mở...).
- **Nhập/xuất CSV:** trang Sản phẩm & Danh mục — xuất toàn bộ, tải file mẫu, nhập có preview và báo lỗi từng dòng (UTF-8 BOM, upsert theo `slug`, tối đa 500 dòng/lần).
- **Khách:** `SSR` lấy data từ Supabase qua `src/lib/supabase/server.ts`.
- **Bảo mật:** `RLS` (Postgres) chặn ghi ngoài admin. Session lưu cookie `httpOnly` qua `@supabase/ssr`.
- **Ảnh:** tải lên client-side → nén WebP → `Supabase Storage`. Không muốn tải ảnh trực tiếp từ link ngoài.

## Cấu trúc

```
src/app/(site)     - Trang khách
src/app/(auth)     - Login/Register/Forgot
src/app/admin      - Admin dashboard
src/components     - Shared components
src/lib            - DB/Supebase helper, validators, uploads
docs/API-DB.md     - Hợp đồng API/DB (đóng băng)
supabase/          - Migration SQL viết tay
```

## Lưu ý khi 5 agent song song

1. Writing to the same file `.gitignore` or `package.json` is forbidden for agents.
2. The layout files (root, auth, site, admin) are written by **A3** (site) and **A2** (auth/admin shell).
3. No `npm install` inside agents.
4. `docs/DB.md` + `docs/INSTRUCTIONS.md` are the truth for schemas.
5. When done push to `git`, run `npm run build` to verify.

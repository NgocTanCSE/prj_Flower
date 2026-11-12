# Tiệm Hoa CoBeCuBe

Website SSR thương mại cho tiệm hoa.تام

## Stack

| Thành phần | Chọn | Vì sao |
|---|---|---|
| Frontend | **Next.js 15** (App Router, TypeScript, Tailwind) | SSR, SEO, Server Actions |
| DB/Auth/Storage | **Supabase** (Postgres + Auth + RLS + Storage) | Tạo trong 10 phút, free tier |
| Deploy | **Netlify** | miễn phí, thương mại |
| Lưu trữ ảnh | Supabase Storage | tự lưu, CDN |

## Quản lý

- **Admin:** `/admin` — Login, thêm/sửa sản phẩm, danh mục, đánh giá, hình ảnh, cài đặt site (SĐT, Zalo, Messenger, địa chỉ, giờ mở...).
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

# Giải thích cấu hình - Đơn giản hóa

## Mục tiêu: **Ẩn trang đăng nhập, chỉ admin mới biết đường dẫn**

---

## 1. URL mapping (route mapping)

| User truy cập | Thực tế render | Ai được vào |
|---------------|----------------|-------------|
| `/admin/login` | `src/app/admin/login/page.tsx` | **Mọi người** (public, không cần session) |
| `/admin/*` (dashboard, san-pham, etc.) | `src/app/admin/*` | **Chỉ admin đã login** |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Mọi người (quên pass) |
| `/reset-password` | `src/app/reset-password/page.tsx` | Chỉ admin có link hợp lệ (từ email magic link) |
| `/login` | **KHÔNG TỒN TẠI** (đã xóa) | — |

---

## 2. Middleware logic (`middleware.ts`)

```
Request đến /admin/login
    │
    ├─► Middleware KIỂM TRA: pathname === '/admin/login' ?
    │       │
    │       └── YES ──► NextResponse.next()  (CHO ĐI, không check session)
    │
    └─► NO (ví dụ /admin/dashboard, /admin/san-pham)
            │
            └── Check session + profile.role === 'admin'
                    │
                    ├─► Hợp lệ ──► NextResponse.next()
                    └─► Không hợp lệ ──► Redirect về /admin/login
```

**Code 핵심:**
```typescript
// Cho phép /admin/login không cần session
if (pathname === ADMIN_LOGIN) {
  return response  // NextResponse.next()
}

// Bảo vệ /admin/*
if (pathname.startsWith('/admin')) {
  const session = await supabase.auth.getSession()
  if (!session) return redirect('/admin/login')
  if (!isAdmin) return redirect('/')
}
```

---

## 3. Flow đăng nhập

```
1. Admin gõ: https://domain.com/admin/login
   │
   ▼
2. Render trang login (src/app/admin/login/page.tsx)
   │
   ▼
3. Submit form → Server Action login() (src/app/(auth)/actions.ts)
   │
   ▼
4. Kiểm tra email/password + profile.role === 'admin'
   │
   ├─► OK ──► return { redirect: '/admin' }
   └─► FAIL ──► return { error: '...' }
   │
   ▼
5. Client redirect về /admin
   │
   ▼
6. Middleware check session → PASS → render admin dashboard
```

---

## 4. Các file liên quan (tóm tắt)

| File | Vai trò |
|------|---------|
| `middleware.ts` | Guard: allow `/admin/login` public, protect `/admin/*` |
| `src/app/admin/login/page.tsx` | UI đăng nhập (client component) |
| `src/app/(auth)/actions.ts` | Server Action `login()` - check role admin |
| `src/app/admin/layout.tsx` | Double-check: redirect `/admin/login` nếu chưa login |
| `src/app/(auth)/forgot-password/page.tsx` | Link "Quay lại đăng nhập" → `/admin/login` |
| `src/app/reset-password/page.tsx` | Đổi mật khẩu từ magic link, xong redirect `/` |

---

## 5. Không còn route nào public trỏ đến login

- ❌ Xóa `/login` page
- ❌ Xóa `/register` page  
- ❌ Footer/Header site KHÔNG có link "Đăng nhập"
- ✅ Chỉ biết `/admin/login` là vào được

---

## 6. Deploy Cloudflare Workers (OpenNext)

- Production URL: **https://prj-flower.flowershop.workers.dev**
- Worker: `prj-flower`, chạy trên Cloudflare Workers.
- Build: `opennextjs-cloudflare build` → `.open-next/worker.js` + `.open-next/assets`.
- `wrangler.jsonc`: static assets trong `.open-next/assets`.
- `open-next.config.ts`: cấu hình tối giản, không bật R2/D1/Durable Objects.
- `public/_headers`: cache `/_next/static/*` với `immutable`.
- Security headers (`X-Frame-Options`, ...): `next.config.mjs` → `headers()`.

```
npm run preview   # build + chạy Worker local
npm run deploy    # build + deploy lên Cloudflare
npm run upload    # build + upload version
npm run cf-typegen
```

Phân biệt build-time và runtime:

- Build-time, đọc từ `.env.local` khi deploy từ máy:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SITE_URL`.
- Runtime secrets/vars trên Worker:
  `SUPABASE_SERVICE_KEY` (secret), `ADMIN_EMAIL`, `SITE_URL`.
- `NEXT_PUBLIC_*` được inline vào bundle lúc build.
- Không đặt `SUPABASE_SERVICE_KEY` trong `.env.local`; dùng
  `npx wrangler secret put SUPABASE_SERVICE_KEY`.

### Cloudflare Access / Zero Trust

Không cần bật cho dự án này. Access là lớp đăng nhập bổ sung trước toàn bộ
Worker; nếu bật cho site public, khách sẽ bị chặn trước khi vào web. App đã tự
bảo vệ `/admin` bằng Supabase Auth + `middleware.ts`.

Tất cả route (site + admin) cùng 1 Worker, cùng 1 domain.
# Giải thích cấu hình - Đơn giản hóa

## Mục tiêu: **Ẩn trang đăng nhập, chỉ admin mới biết đường dẫn**

---

## 1. URL mapping (route mapping)

| User truy cập | Thực tế render | Ai được vào |
|---------------|----------------|-------------|
| `/admin/login` | `src/app/admin/login/page.tsx` | **Mọi người** (public, không cần session) |
| `/admin/*` (dashboard, san-pham, etc.) | `src/app/admin/*` | **Chỉ admin đã login** |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Mọi người (quên pass) |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | Mọi người (từ email magic link) |
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
| `src/app/(auth)/reset-password/page.tsx` | Link "Đăng nhập lại" → `/admin/login` |

---

## 5. Không còn route nào public trỏ đến login

- ❌ Xóa `/login` page
- ❌ Xóa `/register` page  
- ❌ Footer/Header site KHÔNG có link "Đăng nhập"
- ✅ Chỉ biết `/admin/login` là vào được

---

## 6. Deploy Netlify (single app)

```
netlify.toml:
  command = "next build"
  publish = ".next"
  
GitHub Actions: build → deploy .next lên Netlify
```

Tất cả route (site + admin) cùng 1 deploy, cùng 1 domain.